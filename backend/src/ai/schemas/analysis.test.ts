import assert from "node:assert/strict";
import { test } from "node:test";
import { RADAR_KEYS } from "../../modules/users/defaults.js";
import { validateAnalysisResult } from "./analysis.js";

const validItem = { title: "a", detail: "b", sourceEvidence: "bio" };

const validPayload = {
  confidenceLabel: "ok",
  matchLabel: "khớp",
  matchBadgeTone: "match" as const,
  aiQuickSummary: { positive: "p", question: "q" },
  compareRows: [{ label: "l", userValue: "u", targetValue: "t" }],
  radarAxes: RADAR_KEYS.map((key) => ({ key, label: key, value: 70 })),
  checklist: {
    matched: [validItem],
    needsCheck: [validItem],
    potentialFriction: [],
  },
  icebreakers: ["hi"],
  probingQuestions: ["ask"],
  nextDatePlan: { title: "cafe", detail: "public" },
};

test("validateAnalysisResult accepts a grounded payload", () => {
  const result = validateAnalysisResult({
    overallCompatibility: 81,
    dataCompleteness: 74,
    welcomeHtml: "hello <strong>x</strong>",
    payload: validPayload,
  });
  assert.equal(result.overallCompatibility, 81);
});

test("validateAnalysisResult rejects checklist items without sourceEvidence", () => {
  assert.throws(
    () =>
      validateAnalysisResult({
        overallCompatibility: 50,
        dataCompleteness: 50,
        welcomeHtml: "hi",
        payload: {
          ...validPayload,
          checklist: {
            matched: [{ title: "x", detail: "y", sourceEvidence: "   " }],
            needsCheck: [],
            potentialFriction: [],
          },
        },
      }),
    /sourceEvidence/
  );
});

test("validateAnalysisResult rejects incomplete radar", () => {
  assert.throws(
    () =>
      validateAnalysisResult({
        overallCompatibility: 50,
        dataCompleteness: 50,
        welcomeHtml: "hi",
        payload: { ...validPayload, radarAxes: [{ key: "interests", label: "i", value: 10 }] },
      }),
    /radar/
  );
});
