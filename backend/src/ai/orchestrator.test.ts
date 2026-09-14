import assert from "node:assert/strict";
import { test } from "node:test";
import { HttpError } from "../shared/http.js";
import { completeJsonWithRetry } from "./orchestrator.js";
import type { LlmProvider } from "./providers/provider.interface.js";

test("completeJsonWithRetry retries invalid JSON then succeeds", async () => {
  let calls = 0;
  const provider: LlmProvider = {
    name: "fake",
    completeJson: async () => {
      calls += 1;
      if (calls === 1) return { text: "not-json", usage: { promptTokens: 1, completionTokens: 1 } };
      return { text: '{"ok":true}', usage: { promptTokens: 1, completionTokens: 2 } };
    },
  };
  const out = await completeJsonWithRetry(provider, {
    workflow: "chat",
    system: "s",
    user: "u",
    maxRetries: 1,
    timeoutMs: 1000,
  });
  assert.equal(calls, 2);
  assert.deepEqual(out.value, { ok: true });
});

test("completeJsonWithRetry maps timeout to LLM_UNAVAILABLE", async () => {
  const provider: LlmProvider = {
    name: "fake",
    completeJson: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return { text: "{}", usage: { promptTokens: 0, completionTokens: 0 } };
    },
  };
  await assert.rejects(
    () =>
      completeJsonWithRetry(provider, {
        workflow: "chat",
        system: "s",
        user: "u",
        maxRetries: 0,
        timeoutMs: 5,
      }),
    (err: unknown) => err instanceof HttpError && err.code === "LLM_UNAVAILABLE"
  );
});
