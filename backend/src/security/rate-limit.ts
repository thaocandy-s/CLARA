const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

const hits = new Map<string, { count: number; resetAt: number }>();

export const consumeLoginAttempt = (key: string) => {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
};
