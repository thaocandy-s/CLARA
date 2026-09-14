import { buildAnalysis, buildChatReply, type AnalyzeInput } from "../../modules/clara/engine.js";
import type { ChatPromptInput } from "../prompts/chat.js";
import type { CompleteJsonRequest, CompleteJsonResponse, LlmProvider } from "./provider.interface.js";

const parseChatUser = (user: string): ChatPromptInput => {
  const parsed = JSON.parse(user) as ChatPromptInput;
  return parsed;
};

export const createDeterministicProvider = (): LlmProvider => ({
  name: "deterministic",
  completeJson: async (req: CompleteJsonRequest): Promise<CompleteJsonResponse> => {
    if (req.workflow === "chat") {
      const input = parseChatUser(req.user);
      const reply = buildChatReply(
        input.locale,
        input.candidateName,
        input.overallCompatibility,
        input.icebreakers,
        input.probingQuestions,
        input.nextDatePlan,
        input.financeKnown,
        input.userText
      );
      return { text: JSON.stringify(reply), usage: { promptTokens: 0, completionTokens: 0 }, model: "deterministic" };
    }
    const input = JSON.parse(req.user) as {
      locale: AnalyzeInput["locale"];
      user: { name: string; criteria: AnalyzeInput["criteria"] };
      candidate: AnalyzeInput["candidate"];
      pendingNotes: string[];
    };
    const result = buildAnalysis({
      locale: input.locale,
      userName: input.user.name,
      criteria: input.user.criteria,
      candidate: input.candidate,
      pendingNotes: input.pendingNotes ?? [],
    });
    return { text: JSON.stringify(result), usage: { promptTokens: 0, completionTokens: 0 }, model: "deterministic" };
  },
});
