import type { AnalyzeInput } from "../../modules/clara/engine.js";
import { claraPersona } from "./clara-persona.js";

export const analyzeSystemPrompt = (locale: AnalyzeInput["locale"]) =>
  [
    claraPersona(locale),
    "Workflow: initial compatibility analysis.",
    "Every checklist item MUST include sourceEvidence citing bio, questionnaire field, tags, or user note.",
    "Return JSON: overallCompatibility, dataCompleteness, welcomeHtml, payload { confidenceLabel, matchLabel, matchBadgeTone, aiQuickSummary, compareRows, radarAxes (7 keys: long_term_goals, core_values, communication, lifestyle_habits, interests, finances, future_plans), checklist { matched, needsCheck, potentialFriction }, icebreakers, probingQuestions, nextDatePlan }.",
    "welcomeHtml may use <strong> and <br> only.",
  ].join("\n");

export const analyzeUserPrompt = (input: AnalyzeInput) =>
  JSON.stringify({
    locale: input.locale,
    user: { name: input.userName, criteria: input.criteria },
    candidate: input.candidate,
    pendingNotes: input.pendingNotes,
    instruction:
      input.locale === "ja"
        ? "上記だけを根拠に分析JSONを返す。"
        : "Chỉ dùng dữ liệu trên để trả analysis JSON.",
  });
