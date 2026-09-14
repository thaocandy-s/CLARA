import type { AnalyzeInput } from "../../modules/clara/engine.js";
import type { ChatPromptInput } from "../prompts/chat.js";
import type { AnalysisPayload } from "../schemas/analysis.js";

export const packAnalyzeContext = (input: AnalyzeInput) => ({
  locale: input.locale,
  userName: input.userName,
  criteria: input.criteria,
  candidate: input.candidate,
  pendingNotes: input.pendingNotes,
});

export const packReanalyzeContext = (input: AnalyzeInput, previous: AnalysisPayload | null) => ({
  ...packAnalyzeContext(input),
  previousAnalysis: previous,
});

export const packChatContext = (input: ChatPromptInput) => ({
  locale: input.locale,
  candidateName: input.candidateName,
  scores: { overallCompatibility: input.overallCompatibility },
  icebreakers: input.icebreakers,
  probingQuestions: input.probingQuestions,
  nextDatePlan: input.nextDatePlan,
  financeKnown: input.financeKnown,
  recentMessages: input.recentMessages.slice(-8),
  notes: input.notes.slice(0, 10),
  userText: input.userText,
});
