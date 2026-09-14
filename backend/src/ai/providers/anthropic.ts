import { HttpError } from "../../shared/http.js";
import type { CompleteJsonRequest, CompleteJsonResponse, LlmProvider } from "./provider.interface.js";

const maxTokensFor = (workflow: CompleteJsonRequest["workflow"]) => (workflow === "chat" ? 1200 : 2200);

export const anthropicApiKey = () => {
  const dedicated = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  if (dedicated) return dedicated;
  const shared = (process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY ?? "").trim();
  return shared.startsWith("sk-ant-") ? shared : "";
};

export const createAnthropicProvider = (): LlmProvider => ({
  name: "anthropic",
  completeJson: async (req: CompleteJsonRequest): Promise<CompleteJsonResponse> => {
    const apiKey = anthropicApiKey();
    if (!apiKey) throw new HttpError(503, "LLM_UNAVAILABLE", "Missing ANTHROPIC_API_KEY");
    const base = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\/$/, "");
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
    const response = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      signal: req.signal,
      body: JSON.stringify({
        model,
        max_tokens: maxTokensFor(req.workflow),
        temperature: 0.3,
        system: `${req.system}\nReturn a single JSON object only. No markdown.`,
        messages: [{ role: "user", content: req.user }],
      }),
    });
    if (!response.ok) {
      throw new HttpError(503, "LLM_UNAVAILABLE", `Clara provider error (${response.status})`);
    }
    const body = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };
    const text = body.content?.find((part) => part.type === "text")?.text ?? body.content?.[0]?.text ?? "";
    if (!text) throw new HttpError(422, "LLM_SCHEMA", "Empty model content");
    return {
      text,
      model: body.model ?? model,
      usage: {
        promptTokens: body.usage?.input_tokens ?? 0,
        completionTokens: body.usage?.output_tokens ?? 0,
      },
    };
  },
});
