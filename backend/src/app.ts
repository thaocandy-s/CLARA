import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { DEFAULT_WEIGHTS } from "./modules/users/defaults.js";
import { hashPassword, verifyPassword } from "./security/password.js";
import { consumeLoginAttempt } from "./security/rate-limit.js";
import {
  COOKIE_NAME,
  createSession,
  readSessionUser,
  revokeSession,
  SESSION_TTL_MS,
} from "./security/session.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 4;

type Env = { Variables: { user: { id: string; name: string; email: string } } };

const errorBody = (code: string, message: string) => ({ error: { code, message } });

const cookieOpts = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const emptyCandidateOverlay = () => ({
  overallCompatibility: 0,
  dataCompleteness: 0,
  confidenceLabel: "",
  matchLabel: "",
  matchBadgeTone: "check" as const,
  aiQuickSummary: { positive: "", question: "" },
  compareRows: [],
  radarAxes: [
    { key: "long_term_goals", label: "Mục tiêu lâu dài", value: 0 },
    { key: "core_values", label: "Giá trị sống", value: 0 },
    { key: "communication", label: "Giao tiếp", value: 0 },
    { key: "lifestyle_habits", label: "Lối sống & Thói quen", value: 0 },
    { key: "interests", label: "Sở thích & Giải trí", value: 0 },
    { key: "finances", label: "Tài chính & Thực tế", value: 0 },
    { key: "future_plans", label: "Kế hoạch tương lai", value: 0 },
  ],
  checklist: { matched: [], needsCheck: [], potentialFriction: [] },
  icebreakers: [],
  probingQuestions: [],
  chatHistory: [],
  stage: "chatting" as const,
  stageLabel: "",
  savedLabel: "",
  notes: [],
  nextDatePlan: { title: "", detail: "" },
});

const localeFrom = (header: string | undefined) =>
  header?.toLowerCase().includes("ja") ? "ja" : "vi";

export const createApp = (db: Database.Database) => {
  const app = new Hono<Env>();

  const publicAuth = new Set(["/api/auth/register", "/api/auth/login"]);

  app.onError((err, c) => {
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
    let body: { name?: string; email?: string; password?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json(errorBody("VALIDATION", "Invalid JSON"), 400);
    }
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!name || !EMAIL_PATTERN.test(email) || password.length < MIN_PASSWORD) {
      return c.json(errorBody("VALIDATION", "Invalid registration fields"), 400);
    }
    const exists = db
      .prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE")
      .get(email);
    if (exists) {
      return c.json(errorBody("EMAIL_TAKEN", "Email already registered"), 409);
    }
    const now = new Date().toISOString();
    const userId = `usr_${randomBytes(8).toString("hex")}`;
    try {
      db.transaction(() => {
        db.prepare(
          `INSERT INTO users (id, email, name, password_hash, created_at)
           VALUES (?, ?, ?, ?, ?)`
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
    let body: { email?: string; password?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json(errorBody("VALIDATION", "Invalid JSON"), 400);
    }
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const ip = c.req.header("x-forwarded-for") ?? "local";
    if (!consumeLoginAttempt(`${ip}:${email}`)) {
      return c.json(errorBody("RATE_LIMIT", "Too many login attempts"), 429);
    }
    const row = db
      .prepare("SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ? COLLATE NOCASE")
      .get(email) as
      | { id: string; name: string; email: string; passwordHash: string }
      | undefined;
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

  app.put("/api/me/criteria", async (c) => {
    const sessionUser = c.get("user");
    let body: { weights?: unknown; dealBreakerFlags?: Record<string, boolean>; version?: number; userId?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json(errorBody("VALIDATION", "Invalid JSON"), 400);
    }
    void body.userId;
    const now = new Date().toISOString();
    const current = db
      .prepare("SELECT version, weights_json AS weightsJson FROM user_criteria WHERE user_id = ?")
      .get(sessionUser.id) as { version: number; weightsJson: string } | undefined;
    if (!current) return c.json(errorBody("NOT_FOUND", "Criteria not found"), 404);
    if (body.version !== undefined && body.version !== current.version) {
      return c.json(errorBody("VERSION_CONFLICT", "Criteria were updated elsewhere"), 409);
    }
    const weights = body.weights ?? JSON.parse(current.weightsJson);
    const flags = body.dealBreakerFlags ?? {};
    db.prepare(
      `UPDATE user_criteria SET
        weights_json = ?,
        deal_breaker_no_smoking = COALESCE(?, deal_breaker_no_smoking),
        deal_breaker_long_term = COALESCE(?, deal_breaker_long_term),
        deal_breaker_pet_friendly = COALESCE(?, deal_breaker_pet_friendly),
        version = version + 1,
        updated_at = ?
       WHERE user_id = ?`
    ).run(
      JSON.stringify(weights),
      flags.no_smoking === undefined ? null : flags.no_smoking ? 1 : 0,
      flags.long_term === undefined ? null : flags.long_term ? 1 : 0,
      flags.pet_friendly === undefined ? null : flags.pet_friendly ? 1 : 0,
      now,
      sessionUser.id
    );
    const row = db
      .prepare(
        `SELECT u.name, c.age, c.city, c.intent, c.weights_json AS weightsJson, c.version,
                c.deal_breaker_no_smoking AS noSmoking,
                c.deal_breaker_long_term AS longTerm,
                c.deal_breaker_pet_friendly AS petFriendly
         FROM users u
         JOIN user_criteria c ON c.user_id = u.id
         WHERE u.id = ?`
      )
      .get(sessionUser.id) as {
      name: string;
      age: number | null;
      city: string | null;
      intent: string | null;
      weightsJson: string;
      version: number;
      noSmoking: number;
      longTerm: number;
      petFriendly: number;
    };
    return c.json({
      name: row.name,
      age: row.age,
      city: row.city,
      intent: row.intent,
      dealBreakers: [],
      dealBreakerFlags: {
        no_smoking: row.noSmoking === 1,
        long_term: row.longTerm === 1,
        pet_friendly: row.petFriendly === 1,
      },
      weights: JSON.parse(row.weightsJson),
      version: row.version,
    });
  });

  app.get("/api/me/privacy", (c) => {
    const sessionUser = c.get("user");
    const row = db
      .prepare(
        `SELECT incognito, hide_from_partner AS hideFromPartner, no_training AS noTraining
         FROM privacy_settings WHERE user_id = ?`
      )
      .get(sessionUser.id) as
      | { incognito: number; hideFromPartner: number; noTraining: number }
      | undefined;
    if (!row) return c.json(errorBody("NOT_FOUND", "Privacy not found"), 404);
    return c.json({
      incognito: row.incognito === 1,
      hideFromPartner: row.hideFromPartner === 1,
      noTraining: row.noTraining === 1,
    });
  });

  app.put("/api/me/privacy", async (c) => {
    const sessionUser = c.get("user");
    let body: { incognito?: boolean; hideFromPartner?: boolean; noTraining?: boolean; userId?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json(errorBody("VALIDATION", "Invalid JSON"), 400);
    }
    void body.userId;
    db.prepare(
      `UPDATE privacy_settings SET
        incognito = COALESCE(?, incognito),
        hide_from_partner = COALESCE(?, hide_from_partner),
        no_training = COALESCE(?, no_training),
        updated_at = ?
       WHERE user_id = ?`
    ).run(
      body.incognito === undefined ? null : body.incognito ? 1 : 0,
      body.hideFromPartner === undefined ? null : body.hideFromPartner ? 1 : 0,
      body.noTraining === undefined ? null : body.noTraining ? 1 : 0,
      new Date().toISOString(),
      sessionUser.id
    );
    const row = db
      .prepare(
        `SELECT incognito, hide_from_partner AS hideFromPartner, no_training AS noTraining
         FROM privacy_settings WHERE user_id = ?`
      )
      .get(sessionUser.id) as { incognito: number; hideFromPartner: number; noTraining: number };
    return c.json({
      incognito: row.incognito === 1,
      hideFromPartner: row.hideFromPartner === 1,
      noTraining: row.noTraining === 1,
    });
  });

  app.delete("/api/me/analysis-history", (c) => {
    const sessionUser = c.get("user");
    db.prepare("DELETE FROM explorations WHERE user_id = ?").run(sessionUser.id);
    return c.body(null, 204);
  });

  app.get("/api/me/criteria", (c) => {
    const sessionUser = c.get("user");
    const row = db
      .prepare(
        `SELECT u.name, c.age, c.city, c.intent, c.weights_json AS weightsJson, c.version,
                c.deal_breaker_no_smoking AS noSmoking,
                c.deal_breaker_long_term AS longTerm,
                c.deal_breaker_pet_friendly AS petFriendly
         FROM users u
         JOIN user_criteria c ON c.user_id = u.id
         WHERE u.id = ?`
      )
      .get(sessionUser.id) as
      | {
          name: string;
          age: number | null;
          city: string | null;
          intent: string | null;
          weightsJson: string;
          version: number;
          noSmoking: number;
          longTerm: number;
          petFriendly: number;
        }
      | undefined;
    if (!row) return c.json(errorBody("NOT_FOUND", "Criteria not found"), 404);
    return c.json({
      name: row.name,
      age: row.age,
      city: row.city,
      intent: row.intent,
      dealBreakers: [],
      dealBreakerFlags: {
        no_smoking: row.noSmoking === 1,
        long_term: row.longTerm === 1,
        pet_friendly: row.petFriendly === 1,
      },
      weights: JSON.parse(row.weightsJson),
      version: row.version,
    });
  });

  app.get("/api/candidates", (c) => {
    const locale = localeFrom(c.req.header("Accept-Language"));
    const rows = db
      .prepare(
        `SELECT c.id, c.age, c.distance_km AS distanceKm, c.gradient,
                i.name, i.job, i.location, i.bio, i.tags_json AS tagsJson
         FROM candidates c
         JOIN candidate_i18n i ON i.candidate_id = c.id AND i.locale = ?`
      )
      .all(locale) as Array<{
      id: string;
      age: number;
      distanceKm: number;
      gradient: string;
      name: string;
      job: string;
      location: string;
      bio: string;
      tagsJson: string;
    }>;
    const items = rows.map((row) => ({
      ...emptyCandidateOverlay(),
      id: row.id,
      name: row.name,
      age: row.age,
      job: row.job,
      location: row.location,
      distanceKm: row.distanceKm,
      bio: row.bio,
      tags: JSON.parse(row.tagsJson) as string[],
      gradient: row.gradient,
    }));
    return c.json({ items });
  });

  app.get("/api/explorations", (c) => {
    const sessionUser = c.get("user");
    const rows = db
      .prepare("SELECT id FROM explorations WHERE user_id = ?")
      .all(sessionUser.id);
    return c.json({ items: rows });
  });

  return app;
};
