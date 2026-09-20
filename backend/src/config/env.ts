import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export type LlmProvider = "demo" | "openai" | "anthropic";

const rawLlmProvider = (process.env.LLM_PROVIDER ?? "demo").toLowerCase();
const llmProvider: LlmProvider =
  rawLlmProvider === "openai" || rawLlmProvider === "anthropic"
    ? rawLlmProvider
    : "demo";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/ps26122"),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  llm: {
    // "demo" (default) needs no API key and uses a deterministic parser —
    // see services/extraction/demoExtractor.ts. Set LLM_PROVIDER to
    // "openai" or "anthropic" (plus LLM_API_KEY) to use a real model.
    provider: llmProvider,
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL,
  },
};

export const isProduction = env.nodeEnv === "production";
