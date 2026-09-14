export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
};

export type CompleteJsonRequest = {
  workflow: "analyze" | "reanalyze" | "chat";
  system: string;
  user: string;
  noTraining?: boolean;
  timeoutMs: number;
  signal?: AbortSignal;
};

export type CompleteJsonResponse = {
  text: string;
  usage: TokenUsage;
  model?: string;
};

export type LlmProvider = {
  name: string;
  completeJson: (req: CompleteJsonRequest) => Promise<CompleteJsonResponse>;
};
