import assert from "node:assert/strict";
import { test } from "node:test";
import { assertGuardrails } from "./guardrails.js";

test("assertGuardrails allows coaching copy", () => {
  assertGuardrails("Độ khớp 81% với ưu tiên của bạn, không phải xếp hạng con người.");
});

test("assertGuardrails rejects ranking language", () => {
  assert.throws(() => assertGuardrails("Người này kém, đừng match."), /guardrail/i);
});

test("assertGuardrails rejects safety-from-score claims", () => {
  assert.throws(() => assertGuardrails("81% nên an toàn tuyệt đối khi gặp."), /guardrail/i);
});
