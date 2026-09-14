import { RADAR_KEYS } from "../../modules/users/defaults.js";
import { HttpError } from "../../shared/http.js";

export type ChecklistItem = { title: string; detail: string; sourceEvidence: string; tag?: string };

export type AnalysisPayload = {
  confidenceLabel: string;
  matchLabel: string;
  matchBadgeTone: "match" | "check";
  aiQuickSummary: { positive: string; question: string };
  compareRows: Array<{ label: string; userValue: string; targetValue: string; needsConfirmation?: boolean }>;
  radarAxes: Array<{ key: string; label: string; value: number }>;
  checklist: {
    matched: ChecklistItem[];
    needsCheck: ChecklistItem[];
    potentialFriction: ChecklistItem[];
  };
  icebreakers: string[];
  probingQuestions: string[];
  nextDatePlan: { title: string; detail: string };
};

export type AnalysisResult = {
  overallCompatibility: number;
  dataCompleteness: number;
  payload: AnalysisPayload;
  welcomeHtml: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asScore = (value: unknown, field: string) => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new HttpError(422, "LLM_SCHEMA", `${field} must be 0–100`);
  }
  return Math.round(n);
};

const asNonEmpty = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(422, "LLM_SCHEMA", `${field} is required`);
  }
  return value;
};

const asStringArray = (value: unknown, field: string) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new HttpError(422, "LLM_SCHEMA", `${field} must be non-empty strings`);
  }
  return value as string[];
};

const asItem = (value: unknown, field: string): ChecklistItem => {
  if (!isRecord(value)) throw new HttpError(422, "LLM_SCHEMA", `${field} invalid`);
  const sourceEvidence = asNonEmpty(value.sourceEvidence, `${field}.sourceEvidence`);
  return {
    title: asNonEmpty(value.title, `${field}.title`),
    detail: asNonEmpty(value.detail, `${field}.detail`),
    sourceEvidence,
    ...(typeof value.tag === "string" ? { tag: value.tag } : {}),
  };
};

const asItems = (value: unknown, field: string) => {
  if (!Array.isArray(value)) throw new HttpError(422, "LLM_SCHEMA", `${field} must be an array`);
  return value.map((item, i) => asItem(item, `${field}[${i}]`));
};

export const validateAnalysisPayload = (raw: unknown): AnalysisPayload => {
  if (!isRecord(raw)) throw new HttpError(422, "LLM_SCHEMA", "payload must be an object");
  const summary = isRecord(raw.aiQuickSummary) ? raw.aiQuickSummary : null;
  if (!summary) throw new HttpError(422, "LLM_SCHEMA", "aiQuickSummary required");
  const tone = raw.matchBadgeTone;
  if (tone !== "match" && tone !== "check") {
    throw new HttpError(422, "LLM_SCHEMA", "matchBadgeTone invalid");
  }
  if (!Array.isArray(raw.compareRows) || raw.compareRows.length < 1) {
    throw new HttpError(422, "LLM_SCHEMA", "compareRows required");
  }
  const compareRows = raw.compareRows.map((row, i) => {
    if (!isRecord(row)) throw new HttpError(422, "LLM_SCHEMA", `compareRows[${i}] invalid`);
    return {
      label: asNonEmpty(row.label, `compareRows[${i}].label`),
      userValue: asNonEmpty(row.userValue, `compareRows[${i}].userValue`),
      targetValue: asNonEmpty(row.targetValue, `compareRows[${i}].targetValue`),
      ...(row.needsConfirmation === true ? { needsConfirmation: true } : {}),
    };
  });
  if (!Array.isArray(raw.radarAxes)) throw new HttpError(422, "LLM_SCHEMA", "radarAxes required");
  const axes = raw.radarAxes.map((axis, i) => {
    if (!isRecord(axis)) throw new HttpError(422, "LLM_SCHEMA", `radarAxes[${i}] invalid`);
    return {
      key: asNonEmpty(axis.key, `radarAxes[${i}].key`),
      label: asNonEmpty(axis.label, `radarAxes[${i}].label`),
      value: asScore(axis.value, `radarAxes[${i}].value`),
    };
  });
  const keys = axes.map((a) => a.key);
  if (RADAR_KEYS.some((key) => !keys.includes(key)) || axes.length !== RADAR_KEYS.length) {
    throw new HttpError(422, "LLM_SCHEMA", "radarAxes must include exactly the 7 product keys");
  }
  const checklistRaw = isRecord(raw.checklist) ? raw.checklist : null;
  if (!checklistRaw) throw new HttpError(422, "LLM_SCHEMA", "checklist required");
  const plan = isRecord(raw.nextDatePlan) ? raw.nextDatePlan : null;
  if (!plan) throw new HttpError(422, "LLM_SCHEMA", "nextDatePlan required");
  return {
    confidenceLabel: asNonEmpty(raw.confidenceLabel, "confidenceLabel"),
    matchLabel: asNonEmpty(raw.matchLabel, "matchLabel"),
    matchBadgeTone: tone,
    aiQuickSummary: {
      positive: asNonEmpty(summary.positive, "aiQuickSummary.positive"),
      question: asNonEmpty(summary.question, "aiQuickSummary.question"),
    },
    compareRows,
    radarAxes: axes,
    checklist: {
      matched: asItems(checklistRaw.matched, "checklist.matched"),
      needsCheck: asItems(checklistRaw.needsCheck, "checklist.needsCheck"),
      potentialFriction: asItems(checklistRaw.potentialFriction, "checklist.potentialFriction"),
    },
    icebreakers: asStringArray(raw.icebreakers, "icebreakers"),
    probingQuestions: asStringArray(raw.probingQuestions, "probingQuestions"),
    nextDatePlan: {
      title: asNonEmpty(plan.title, "nextDatePlan.title"),
      detail: asNonEmpty(plan.detail, "nextDatePlan.detail"),
    },
  };
};

export const validateAnalysisResult = (raw: unknown): AnalysisResult => {
  if (!isRecord(raw)) throw new HttpError(422, "LLM_SCHEMA", "analysis must be an object");
  return {
    overallCompatibility: asScore(raw.overallCompatibility, "overallCompatibility"),
    dataCompleteness: asScore(raw.dataCompleteness, "dataCompleteness"),
    welcomeHtml: asNonEmpty(raw.welcomeHtml, "welcomeHtml"),
    payload: validateAnalysisPayload(raw.payload),
  };
};
