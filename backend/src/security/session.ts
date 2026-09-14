import { createHash, randomBytes } from "node:crypto";
import type Database from "better-sqlite3";

export const COOKIE_NAME = "clara_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const createSession = (db: Database.Database, userId: string) => {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_MS);
  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    randomBytes(16).toString("hex"),
    userId,
    hashToken(token),
    expires.toISOString(),
    now.toISOString()
  );
  return { token, expires };
};

export type SessionUser = { id: string; name: string; email: string };

export const readSessionUser = (
  db: Database.Database,
  token: string | undefined
): SessionUser | null => {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.expires_at AS expiresAt
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(token)) as
    | { id: string; name: string; email: string; expiresAt: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }
  return { id: row.id, name: row.name, email: row.email };
};

export const revokeSession = (db: Database.Database, token: string | undefined) => {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
};
