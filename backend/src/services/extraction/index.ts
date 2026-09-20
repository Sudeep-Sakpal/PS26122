import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import type { RawExtractionCandidate } from "../../validation/report.validation";
import { runDemoExtraction } from "./demoExtractor";
import { extractWithLlm } from "./llmExtractor";

export interface ExtractionRunResult {
  provider: "demo" | "openai" | "anthropic";
  candidates: RawExtractionCandidate[];
  warnings: string[];
}

// The one place that decides demo vs. real-LLM extraction, kept
// deliberately separate from the demo parser and the LLM adapter so each
// stays simple on its own.
export async function runExtraction(text: string): Promise<ExtractionRunResult> {
  const { provider, apiKey } = env.llm;

  if (provider === "demo") {
    return { provider, candidates: runDemoExtraction(text), warnings: [] };
  }

  if (!apiKey) {
    // Explicit misconfiguration (a real provider was chosen but no key
    // given) is a client-facing error — distinct from simply not having
    // set LLM_PROVIDER at all, which transparently uses demo mode.
    throw ApiError.badRequest(
      `LLM_PROVIDER is set to "${provider}" but LLM_API_KEY is not configured. Set LLM_API_KEY, or set LLM_PROVIDER=demo to use the deterministic extractor.`
    );
  }

  try {
    const candidates = await extractWithLlm(provider, text);
    return { provider, candidates, warnings: [] };
  } catch (err) {
    // A live LLM call can fail or return malformed output for reasons
    // outside our control (rate limits, model drift, etc). Handle that
    // safely: no execution updates rather than a crashed request.
    const message = err instanceof Error ? err.message : String(err);
    return {
      provider,
      candidates: [],
      warnings: [`LLM extraction failed, no execution updates produced: ${message}`],
    };
  }
}
