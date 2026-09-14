const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

const hits = new Map<string, { count: number; resetAt: number }>();

const consume = (store: Map<string, { count: number; resetAt: number }>, key: string, max: number) => {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
};

export const consumeLoginAttempt = (key: string) => consume(hits, key, MAX_ATTEMPTS);

const chatHits = new Map<string, { count: number; resetAt: number }>();
const MAX_CHAT = 60;

export const consumeChatAttempt = (key: string) => consume(chatHits, key, MAX_CHAT);
