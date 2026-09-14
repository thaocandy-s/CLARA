import type { AnalyzeInput } from "../../modules/clara/engine.js";
import { assertGuardrails } from "../evaluators/guardrails.js";
import { completeJsonWithRetry } from "../orchestrator.js";
import { analyzeSystemPrompt, analyzeUserPrompt } from "../prompts/analyze.js";
import { reanalyzeSystemPrompt, reanalyzeUserPrompt } from "../prompts/reanalyze.js";
import type { LlmProvider } from "../providers/provider.interface.js";
import { packAnalyzeContext, packReanalyzeContext } from "../retrieval/assemble.js";
import { validateAnalysisResult, type AnalysisPayload, type AnalysisResult } from "../schemas/analysis.js";

const timeoutMs = () => Number(process.env.CLARA_AI_TIMEOUT_MS ?? 45000);
const maxRetries = () => Number(process.env.CLARA_AI_MAX_RETRIES ?? 1);

export const runAnalyzeWorkflow = async (
  provider: LlmProvider,
  input: AnalyzeInput,
  opts?: { noTraining?: boolean }
): Promise<AnalysisResult> => {
  packAnalyzeContext(input);
  const { value } = await completeJsonWithRetry(provider, {
    workflow: "analyze",
    system: analyzeSystemPrompt(input.locale),
    user: analyzeUserPrompt(input),
    noTraining: opts?.noTraining,
    maxRetries: maxRetries(),
    timeoutMs: timeoutMs(),
  });
  const result = validateAnalysisResult(value);
  assertGuardrails(JSON.stringify(result));
  return result;
};

export const runReanalyzeWorkflow = async (
  provider: LlmProvider,
  input: AnalyzeInput,
  previous: AnalysisPayload | null,
  opts?: { noTraining?: boolean }
): Promise<AnalysisResult> => {
  packReanalyzeContext(input, previous);
  const { value } = await completeJsonWithRetry(provider, {
    workflow: "reanalyze",
    system: reanalyzeSystemPrompt(input.locale),
    user: reanalyzeUserPrompt(input, previous),
    noTraining: opts?.noTraining,
    maxRetries: maxRetries(),
    timeoutMs: timeoutMs(),
  });
  const result = validateAnalysisResult(value);
  assertGuardrails(JSON.stringify(result));
  return result;
};
