import { HttpError } from "../../shared/http.js";
import type { CompleteJsonRequest, CompleteJsonResponse, LlmProvider } from "./provider.interface.js";

const maxTokensFor = (workflow: CompleteJsonRequest["workflow"]) => (workflow === "chat" ? 1200 : 2200);

export const createOpenAiProvider = (): LlmProvider => ({
  name: "openai",
  completeJson: async (req: CompleteJsonRequest): Promise<CompleteJsonResponse> => {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY;
    if (!apiKey) throw new HttpError(503, "LLM_UNAVAILABLE", "Missing OPENAI_API_KEY");
    const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: req.signal,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: maxTokensFor(req.workflow),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
      }),
    });
    if (!response.ok) {
      throw new HttpError(503, "LLM_UNAVAILABLE", `Clara provider error (${response.status})`);
    }
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text) throw new HttpError(422, "LLM_SCHEMA", "Empty model content");
    return {
      text,
      model: body.model ?? model,
      usage: {
        promptTokens: body.usage?.prompt_tokens ?? 0,
        completionTokens: body.usage?.completion_tokens ?? 0,
      },
    };
  },
});
