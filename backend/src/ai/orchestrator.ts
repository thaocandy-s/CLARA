import { HttpError } from "../shared/http.js";
import { recordUsage } from "./usage.js";
import type { CompleteJsonRequest, LlmProvider } from "./providers/provider.interface.js";

export type OrchestratorInput = Omit<CompleteJsonRequest, "timeoutMs" | "signal"> & {
  maxRetries: number;
  timeoutMs: number;
};

const parseJsonObject = (text: string) => {
  const tryParse = (raw: string) => {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  };
  const direct = tryParse(text);
  if (direct !== undefined) return direct;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const sliced = tryParse(text.slice(start, end + 1));
    if (sliced !== undefined) return sliced;
  }
  throw new HttpError(422, "LLM_SCHEMA", "Model did not return JSON");
};

const raceTimeout = async <T>(promise: Promise<T>, timeoutMs: number, controller: AbortController) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error("timeout"), { name: "AbortError" }));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const completeJsonWithRetry = async (provider: LlmProvider, input: OrchestratorInput) => {
  const started = Date.now();
  let lastError: unknown;
  for (let attempt = 0; attempt <= input.maxRetries; attempt++) {
    const controller = new AbortController();
    try {
      const result = await raceTimeout(
        provider.completeJson({
          workflow: input.workflow,
          system: input.system,
          user: input.user,
          noTraining: input.noTraining,
          timeoutMs: input.timeoutMs,
          signal: controller.signal,
        }),
        input.timeoutMs,
        controller
      );
      const value = parseJsonObject(result.text);
      recordUsage({
        workflow: input.workflow,
        provider: provider.name,
        model: result.model,
        latencyMs: Date.now() - started,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        ok: true,
        noTraining: input.noTraining,
      });
      return { value, usage: result.usage, model: result.model };
    } catch (err) {
      lastError = err;
      const timedOut = (err instanceof Error && err.name === "AbortError") || controller.signal.aborted;
      if (timedOut) {
        recordUsage({
          workflow: input.workflow,
          provider: provider.name,
          latencyMs: Date.now() - started,
          promptTokens: 0,
          completionTokens: 0,
          ok: false,
          noTraining: input.noTraining,
        });
        throw new HttpError(503, "LLM_UNAVAILABLE", "Clara timed out");
      }
      if (err instanceof HttpError && err.code !== "LLM_SCHEMA") {
        recordUsage({
          workflow: input.workflow,
          provider: provider.name,
          latencyMs: Date.now() - started,
          promptTokens: 0,
          completionTokens: 0,
          ok: false,
          noTraining: input.noTraining,
        });
        throw err;
      }
      if (!(err instanceof HttpError)) {
        lastError = new HttpError(503, "LLM_UNAVAILABLE", "Clara provider error");
        recordUsage({
          workflow: input.workflow,
          provider: provider.name,
          latencyMs: Date.now() - started,
          promptTokens: 0,
          completionTokens: 0,
          ok: false,
          noTraining: input.noTraining,
        });
        throw lastError;
      }
    }
  }
  recordUsage({
    workflow: input.workflow,
    provider: provider.name,
    latencyMs: Date.now() - started,
    promptTokens: 0,
    completionTokens: 0,
    ok: false,
    noTraining: input.noTraining,
  });
  if (lastError instanceof HttpError) throw lastError;
  throw new HttpError(422, "LLM_SCHEMA", "Model output failed validation");
};
