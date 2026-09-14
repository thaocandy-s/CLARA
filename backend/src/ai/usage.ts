export type UsageEvent = {
  workflow: string;
  provider: string;
  model?: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  ok: boolean;
  noTraining?: boolean;
};

const totals = {
  calls: 0,
  promptTokens: 0,
  completionTokens: 0,
  failures: 0,
};

export const recordUsage = (event: UsageEvent) => {
  totals.calls += 1;
  totals.promptTokens += event.promptTokens;
  totals.completionTokens += event.completionTokens;
  if (!event.ok) totals.failures += 1;
  const line = {
    event: "clara_ai",
    workflow: event.workflow,
    provider: event.provider,
    model: event.model,
    latency_ms: event.latencyMs,
    prompt_tokens: event.noTraining ? undefined : event.promptTokens,
    completion_tokens: event.noTraining ? undefined : event.completionTokens,
    ok: event.ok,
  };
  console.info(JSON.stringify(line));
};

export const usageTotals = () => ({ ...totals });

export const resetUsageForTests = () => {
  totals.calls = 0;
  totals.promptTokens = 0;
  totals.completionTokens = 0;
  totals.failures = 0;
};
