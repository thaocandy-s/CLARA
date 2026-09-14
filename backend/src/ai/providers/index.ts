import { createAnthropicProvider, anthropicApiKey } from "./anthropic.js";
import { createDeterministicProvider } from "./deterministic.js";
import { createOpenAiProvider } from "./openai.js";
import type { LlmProvider } from "./provider.interface.js";

export const liveLlmKey = () =>
  (process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY ?? "").trim();

const looksLikeAnthropic = (key: string) => key.startsWith("sk-ant-");

export const resolveProvider = (override?: LlmProvider): LlmProvider => {
  if (override) return override;
  const name = (process.env.CLARA_AI_PROVIDER ?? "").toLowerCase();
  if (name === "deterministic") return createDeterministicProvider();
  if (name === "anthropic" || name === "claude") return createAnthropicProvider();
  if (name === "openai") {
    if (anthropicApiKey() || looksLikeAnthropic(liveLlmKey())) return createAnthropicProvider();
    return createOpenAiProvider();
  }
  if (process.env.NODE_TEST_CONTEXT) return createDeterministicProvider();
  const key = liveLlmKey();
  if (anthropicApiKey() || looksLikeAnthropic(key)) return createAnthropicProvider();
  if (key) return createOpenAiProvider();
  return createDeterministicProvider();
};

export const describeActiveProvider = () => {
  const provider = resolveProvider();
  if (provider.name === "anthropic") {
    return `anthropic (${process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5"})`;
  }
  if (provider.name === "openai") {
    return `openai (${process.env.OPENAI_MODEL ?? "gpt-4o-mini"})`;
  }
  return "deterministic (điền ANTHROPIC_API_KEY trong backend/.env để chat Claude)";
};
