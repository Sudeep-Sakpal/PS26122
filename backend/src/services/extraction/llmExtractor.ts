import { env, type LlmProvider } from "../../config/env";
import type { RawExtractionCandidate } from "../../validation/report.validation";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "./prompt";

interface LlmUpdatesPayload {
  updates?: unknown;
}

function parseJsonObject(raw: string): LlmUpdatesPayload {
  const attempt = (text: string) => JSON.parse(text) as LlmUpdatesPayload;

  try {
    return attempt(raw);
  } catch {
    // The model may have wrapped the JSON in prose or a markdown fence
    // despite instructions — recover the outermost object and retry once.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Response did not contain a JSON object");
    }
    return attempt(raw.slice(start, end + 1));
  }
}

function toCandidates(payload: LlmUpdatesPayload): RawExtractionCandidate[] {
  if (!Array.isArray(payload.updates)) {
    throw new Error('Response JSON is missing an "updates" array');
  }
  return payload.updates.filter(
    (u): u is RawExtractionCandidate => typeof u === "object" && u !== null
  );
}

async function callOpenAI(text: string): Promise<RawExtractionCandidate[]> {
  const model = env.llm.model || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.llm.apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: buildExtractionUserPrompt(text) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response had no message content");

  return toCandidates(parseJsonObject(content));
}

async function callAnthropic(text: string): Promise<RawExtractionCandidate[]> {
  const model = env.llm.model || "claude-haiku-4-5-20251001";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.llm.apiKey ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildExtractionUserPrompt(text) }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed (${response.status}): ${await response.text()}`);
  }

  const body = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const content = body.content?.find((block) => block.type === "text")?.text;
  if (!content) throw new Error("Anthropic response had no text content");

  return toCandidates(parseJsonObject(content));
}

export async function extractWithLlm(
  provider: Exclude<LlmProvider, "demo">,
  text: string
): Promise<RawExtractionCandidate[]> {
  if (provider === "openai") return callOpenAI(text);
  return callAnthropic(text);
}
