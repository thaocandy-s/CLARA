import { HttpError } from "../../shared/http.js";

export type ChatReply = {
  text: string;
  recommendation?: { title: string; items: string[] };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateChatReply = (raw: unknown): ChatReply => {
  if (!isRecord(raw)) throw new HttpError(422, "LLM_SCHEMA", "chat reply must be an object");
  if (typeof raw.text !== "string" || !raw.text.trim()) {
    throw new HttpError(422, "LLM_SCHEMA", "chat text is required");
  }
  if (raw.recommendation === undefined || raw.recommendation === null) {
    return { text: raw.text };
  }
  if (!isRecord(raw.recommendation)) throw new HttpError(422, "LLM_SCHEMA", "recommendation invalid");
  const title = raw.recommendation.title;
  const items = raw.recommendation.items;
  if (typeof title !== "string" || !title.trim() || !Array.isArray(items) || items.some((i) => typeof i !== "string")) {
    throw new HttpError(422, "LLM_SCHEMA", "recommendation.title/items invalid");
  }
  return { text: raw.text, recommendation: { title, items: items.filter((i) => i.trim()) } };
};
