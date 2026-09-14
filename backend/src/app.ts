import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { analyzeCandidate, reanalyzeCandidate } from "./modules/analyses/service.js";
import { getCandidate, listCandidates } from "./modules/candidates/overlay.js";
import { chatWithClara, clearChat } from "./modules/conversations/service.js";
import {
  addNote,
  archiveExploration,
  matchExploration,
  saveExploring,
} from "./modules/explorations/service.js";
import { DEFAULT_WEIGHTS } from "./modules/users/defaults.js";
import {
  deleteAnalysisHistory,
  getCriteria,
  getPrivacy,
  updateCriteria,
  updatePrivacy,
} from "./modules/users/service.js";
import { hashPassword, verifyPassword } from "./security/password.js";
import { consumeChatAttempt, consumeLoginAttempt } from "./security/rate-limit.js";
import {
  COOKIE_NAME,
  createSession,
  readSessionUser,
  revokeSession,
  SESSION_TTL_MS,
} from "./security/session.js";
import { errorBody, HttpError } from "./shared/http.js";
import { localeFromHeader } from "./shared/locale.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Env = { Variables: { user: { id: string; name: string; email: string } } };

const cookieOpts = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const readJson = async <T>(c: { req: { json: () => Promise<unknown> } }) => {
  try {
    return (await c.req.json()) as T;
  } catch {
    throw new HttpError(400, "VALIDATION", "Invalid JSON");
  }
};

export const createApp = (db: Database.Database) => {
  const app = new Hono<Env>();
  const publicAuth = new Set(["/api/auth/register", "/api/auth/login"]);

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json(errorBody(err.code, err.message), err.status as 400);
    }
    console.error(err);
    return c.json(errorBody("INTERNAL", "Internal server error"), 500);
  });

  app.use("/api/*", async (c, next) => {
    if (publicAuth.has(c.req.path)) {
      await next();
      return;
    }
    if (c.req.path === "/api/auth/logout" && c.req.method === "POST") {
      await next();
      return;
    }
    const token = getCookie(c, COOKIE_NAME);
    const user = readSessionUser(db, token);
    if (!user) {
      return c.json(errorBody("UNAUTHORIZED", "Authentication required"), 401);
    }
    c.set("user", user);
    await next();
  });

  app.post("/api/auth/register", async (c) => {
    const body = await readJson<{ name?: string; email?: string; password?: string }>(c);
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!name || !EMAIL_PATTERN.test(email) || password.length < MIN_PASSWORD) {
      return c.json(errorBody("VALIDATION", "Invalid registration fields"), 400);
    }
    const exists = db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").get(email);
    if (exists) return c.json(errorBody("EMAIL_TAKEN", "Email already registered"), 409);
    const now = new Date().toISOString();
    const userId = `usr_${randomBytes(8).toString("hex")}`;
    try {
      db.transaction(() => {
        db.prepare(
          `INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`
        ).run(userId, email, name, hashPassword(password), now);
        db.prepare(
          `INSERT INTO user_criteria (
            user_id, age, city, intent, lifestyle,
            deal_breaker_no_smoking, deal_breaker_long_term, deal_breaker_pet_friendly,
            weights_json, version, updated_at, created_at
          ) VALUES (?, NULL, NULL, NULL, NULL, 1, 1, 1, ?, 1, ?, ?)`
        ).run(userId, JSON.stringify(DEFAULT_WEIGHTS), now, now);
        db.prepare(
          `INSERT INTO privacy_settings (user_id, incognito, hide_from_partner, no_training, updated_at)
           VALUES (?, 0, 1, 1, ?)`
        ).run(userId, now);
      })();
    } catch {
      return c.json(errorBody("EMAIL_TAKEN", "Email already registered"), 409);
    }
    return c.json({ user: { name, email } }, 201);
  });

  app.post("/api/auth/login", async (c) => {
    const body = await readJson<{ email?: string; password?: string }>(c);
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const ip = c.req.header("x-forwarded-for") ?? "local";
    if (!consumeLoginAttempt(`${ip}:${email}`)) {
      return c.json(errorBody("RATE_LIMIT", "Too many login attempts"), 429);
    }
    const row = db
      .prepare("SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ? COLLATE NOCASE")
      .get(email) as { id: string; name: string; email: string; passwordHash: string } | undefined;
    if (!row || !verifyPassword(password, row.passwordHash)) {
      return c.json(errorBody("INVALID_CREDENTIALS", "Invalid email or password"), 401);
    }
    const { token, expires } = createSession(db, row.id);
    setCookie(c, COOKIE_NAME, token, {
      ...cookieOpts,
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
      expires,
    });
    return c.json({ user: { name: row.name, email: row.email } });
  });

  app.post("/api/auth/logout", async (c) => {
    const token = getCookie(c, COOKIE_NAME);
    revokeSession(db, token);
    deleteCookie(c, COOKIE_NAME, { path: "/" });
    return c.body(null, 204);
  });

  app.get("/api/me", (c) => {
    const sessionUser = c.get("user");
    const criteria = db
      .prepare("SELECT age, city, intent FROM user_criteria WHERE user_id = ?")
      .get(sessionUser.id) as { age: number | null; city: string | null; intent: string | null } | undefined;
    return c.json({
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      age: criteria?.age ?? null,
      city: criteria?.city ?? null,
      intent: criteria?.intent ?? null,
    });
  });

  app.get("/api/me/criteria", (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    return c.json(getCriteria(db, c.get("user").id, locale));
  });

  app.put("/api/me/criteria", async (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    const body = await readJson<{
      weights?: unknown;
      dealBreakerFlags?: Record<string, boolean>;
      version?: number;
    }>(c);
    return c.json(updateCriteria(db, c.get("user").id, locale, body));
  });

  app.get("/api/me/privacy", (c) => c.json(getPrivacy(db, c.get("user").id)));

  app.put("/api/me/privacy", async (c) => {
    const body = await readJson<{ incognito?: unknown; hideFromPartner?: unknown; noTraining?: unknown }>(c);
    return c.json(updatePrivacy(db, c.get("user").id, body));
  });

  app.delete("/api/me/analysis-history", (c) => {
    deleteAnalysisHistory(db, c.get("user").id);
    return c.body(null, 204);
  });

  app.get("/api/candidates", (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    const raw = c.req.query("minCompleteness");
    let min: number | undefined;
    if (raw !== undefined) {
      min = Number(raw);
      if (!Number.isInteger(min) || min < 0 || min > 100) {
        throw new HttpError(400, "VALIDATION", "minCompleteness must be 0–100");
      }
    }
    return c.json({ items: listCandidates(db, c.get("user").id, locale, min) });
  });

  app.get("/api/candidates/:candidateId", (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    return c.json(getCandidate(db, c.get("user").id, locale, c.req.param("candidateId")));
  });

  app.get("/api/explorations", (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    const includeArchived = c.req.query("includeArchived") !== "false";
    const items = listCandidates(db, c.get("user").id, locale).filter(
      (item) => includeArchived || item.stage !== "archived"
    );
    items.sort((a, b) => (a.savedLabel === b.savedLabel ? a.id.localeCompare(b.id) : 0));
    return c.json({ items });
  });

  app.post("/api/explorations/:candidateId", (c) => {
    const result = saveExploring(db, c.get("user").id, c.req.param("candidateId"));
    return c.json({ candidateId: result.candidateId, stage: result.stage }, result.created ? 201 : 200);
  });

  app.post("/api/explorations/:candidateId/match", (c) =>
    c.json(matchExploration(db, c.get("user").id, c.req.param("candidateId")))
  );

  app.post("/api/explorations/:candidateId/archive", (c) =>
    c.json(archiveExploration(db, c.get("user").id, c.req.param("candidateId")))
  );

  app.post("/api/explorations/:candidateId/notes", async (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    const body = await readJson<{ text?: string }>(c);
    const note = addNote(db, c.get("user").id, c.req.param("candidateId"), body.text ?? "", locale);
    return c.json(note, 201);
  });

  app.post("/api/clara/analyze", async (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    const body = await readJson<{ candidateId?: string }>(c);
    if (!body.candidateId) throw new HttpError(400, "VALIDATION", "candidateId is required");
    return c.json(await analyzeCandidate(db, c.get("user").id, locale, body.candidateId));
  });

  app.post("/api/clara/reanalyze", async (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    const body = await readJson<{ candidateId?: string }>(c);
    if (!body.candidateId) throw new HttpError(400, "VALIDATION", "candidateId is required");
    return c.json(await reanalyzeCandidate(db, c.get("user").id, locale, body.candidateId));
  });

  app.post("/api/clara/chat", async (c) => {
    const locale = localeFromHeader(c.req.header("Accept-Language"));
    const body = await readJson<{ candidateId?: string; text?: string }>(c);
    if (!body.candidateId) throw new HttpError(400, "VALIDATION", "candidateId is required");
    if (!consumeChatAttempt(c.get("user").id)) {
      throw new HttpError(429, "RATE_LIMIT", "Too many chat requests");
    }
    return c.json(await chatWithClara(db, c.get("user").id, locale, body.candidateId, body.text ?? ""));
  });

  app.delete("/api/clara/chat/:candidateId", (c) => {
    clearChat(db, c.get("user").id, c.req.param("candidateId"));
    return c.body(null, 204);
  });

  return app;
};
