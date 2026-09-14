import { assertGuardrails } from "../evaluators/guardrails.js";
import { completeJsonWithRetry } from "../orchestrator.js";
import { chatSystemPrompt, chatUserPrompt, type ChatPromptInput } from "../prompts/chat.js";
import type { LlmProvider } from "../providers/provider.interface.js";
import { packChatContext } from "../retrieval/assemble.js";
import { validateChatReply, type ChatReply } from "../schemas/chat.js";

const timeoutMs = () => Number(process.env.CLARA_AI_TIMEOUT_MS ?? 45000);
const maxRetries = () => Number(process.env.CLARA_AI_MAX_RETRIES ?? 1);

export const runChatWorkflow = async (
  provider: LlmProvider,
  input: ChatPromptInput,
  opts?: { noTraining?: boolean }
): Promise<ChatReply> => {
  packChatContext(input);
  const { value } = await completeJsonWithRetry(provider, {
    workflow: "chat",
    system: chatSystemPrompt(input.locale),
    user: chatUserPrompt(input),
    noTraining: opts?.noTraining,
    maxRetries: maxRetries(),
    timeoutMs: timeoutMs(),
  });
  const reply = validateChatReply(value);
  assertGuardrails(`${reply.text} ${reply.recommendation?.title ?? ""} ${reply.recommendation?.items.join(" ") ?? ""}`);
  return reply;
};
