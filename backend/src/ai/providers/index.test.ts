import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { resolveProvider } from "./index.js";

const original = {
  provider: process.env.CLARA_AI_PROVIDER,
  openai: process.env.OPENAI_API_KEY,
  llm: process.env.LLM_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
};

afterEach(() => {
  const restore = (
    key: "CLARA_AI_PROVIDER" | "OPENAI_API_KEY" | "LLM_API_KEY" | "ANTHROPIC_API_KEY",
    value: string | undefined
  ) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  restore("CLARA_AI_PROVIDER", original.provider);
  restore("OPENAI_API_KEY", original.openai);
  restore("LLM_API_KEY", original.llm);
  restore("ANTHROPIC_API_KEY", original.anthropic);
});

test("resolveProvider uses openai when an API key is set", () => {
  process.env.CLARA_AI_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "sk-test";
  delete process.env.LLM_API_KEY;
  assert.equal(resolveProvider().name, "openai");
});

test("resolveProvider uses anthropic for sk-ant keys", () => {
  process.env.CLARA_AI_PROVIDER = "anthropic";
  process.env.ANTHROPIC_API_KEY = "sk-ant-api03-test";
  assert.equal(resolveProvider().name, "anthropic");
});

test("resolveProvider maps sk-ant in OPENAI_API_KEY to anthropic", () => {
  process.env.CLARA_AI_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "sk-ant-api03-test";
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal(resolveProvider().name, "anthropic");
});

test("resolveProvider stays deterministic without a key", () => {
  delete process.env.CLARA_AI_PROVIDER;
  delete process.env.OPENAI_API_KEY;
  delete process.env.LLM_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal(resolveProvider().name, "deterministic");
});
