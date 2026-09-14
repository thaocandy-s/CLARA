import type { AnalyzeInput } from "../../modules/clara/engine.js";
import type { ChatPromptInput } from "../prompts/chat.js";
import { resolveProvider } from "../providers/index.js";
import type { LlmProvider } from "../providers/provider.interface.js";
import type { AnalysisPayload, AnalysisResult } from "../schemas/analysis.js";
import type { ChatReply } from "../schemas/chat.js";
import { runAnalyzeWorkflow, runReanalyzeWorkflow } from "../workflows/analyze.workflow.js";
import { runChatWorkflow } from "../workflows/chat.workflow.js";

export type ClaraService = {
  analyze: (input: AnalyzeInput, opts?: { noTraining?: boolean }) => Promise<AnalysisResult>;
  reanalyze: (
    input: AnalyzeInput,
    previous: AnalysisPayload | null,
    opts?: { noTraining?: boolean }
  ) => Promise<AnalysisResult>;
  chat: (input: ChatPromptInput, opts?: { noTraining?: boolean }) => Promise<ChatReply>;
};

export const createClaraService = (provider?: LlmProvider): ClaraService => {
  const resolved = resolveProvider(provider);
  return {
    analyze: (input, opts) => runAnalyzeWorkflow(resolved, input, opts),
    reanalyze: (input, previous, opts) => runReanalyzeWorkflow(resolved, input, previous, opts),
    chat: (input, opts) => runChatWorkflow(resolved, input, opts),
  };
};

let defaultService: ClaraService | undefined;

export const claraService = () => {
  defaultService ??= createClaraService();
  return defaultService;
};

export const setClaraServiceForTests = (service: ClaraService | undefined) => {
  defaultService = service;
};
