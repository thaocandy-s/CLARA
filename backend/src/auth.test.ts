import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { createApp } from "./app.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const openMigratedDb = () => {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  const dir = path.join(root, "db/migrations");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
  }
  return db;
};

const json = (body: unknown) => JSON.stringify(body);

const register = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json(body),
  });

const login = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json(body),
  });

const cookieFrom = (res: Response) => {
  const raw = res.headers.get("set-cookie") ?? "";
  const match = raw.match(/clara_session=([^;]+)/);
  return match?.[1] ?? "";
};

let db: Database.Database | undefined;

afterEach(() => {
  db?.close();
  db = undefined;
});

test("register creates account without a session cookie", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const res = await register(app, {
    name: "Hải Nam",
    email: "hai@example.com",
    password: "Demo@1234",
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.email, "hai@example.com");
  assert.equal(body.user.name, "Hải Nam");
  assert.equal(res.headers.get("set-cookie"), null);
});

test("register rejects duplicate email", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const payload = { name: "A", email: "dup@example.com", password: "Demo@1234" };
  assert.equal((await register(app, payload)).status, 201);
  const second = await register(app, payload);
  assert.equal(second.status, 409);
});

test("login rejects wrong password and does not set cookie", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  await register(app, { name: "A", email: "a@example.com", password: "Demo@1234" });
  const res = await login(app, { email: "a@example.com", password: "wrong-pass" });
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("set-cookie"), null);
});

test("login sets httpOnly session cookie; GET /me uses session not client user id", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  await register(app, { name: "Hải Nam", email: "hai@example.com", password: "Demo@1234" });
  const res = await login(app, { email: "hai@example.com", password: "Demo@1234" });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /HttpOnly/i);
  const token = cookieFrom(res);
  assert.ok(token.length >= 32);

  const spoofed = await app.request("/api/me", {
    headers: {
      Cookie: `clara_session=${token}`,
      "Content-Type": "application/json",
      "X-User-Id": "usr_attacker",
    },
  });
  assert.equal(spoofed.status, 200);
  const me = await spoofed.json();
  assert.equal(me.email, "hai@example.com");
  assert.notEqual(me.id, "usr_attacker");
});

test("protected routes return 401 without a session", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  assert.equal((await app.request("/api/me")).status, 401);
  assert.equal((await app.request("/api/candidates")).status, 401);
  assert.equal((await app.request("/api/me/criteria")).status, 401);
  assert.equal((await app.request("/api/explorations")).status, 401);
});

test("logout revokes the session", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  await register(app, { name: "A", email: "a@example.com", password: "Demo@1234" });
  const loggedIn = await login(app, { email: "a@example.com", password: "Demo@1234" });
  const token = cookieFrom(loggedIn);
  const out = await app.request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: `clara_session=${token}` },
  });
  assert.equal(out.status, 204);
  const me = await app.request("/api/me", {
    headers: { Cookie: `clara_session=${token}` },
  });
  assert.equal(me.status, 401);
});

test("criteria GET is scoped to the session user even if another userId is supplied", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  await register(app, { name: "Alice", email: "alice@example.com", password: "Demo@1234" });
  await register(app, { name: "Bob", email: "bob@example.com", password: "Demo@1234" });
  const aliceLogin = await login(app, { email: "alice@example.com", password: "Demo@1234" });
  const token = cookieFrom(aliceLogin);
  const res = await app.request("/api/me/criteria?userId=usr_bob", {
    headers: { Cookie: `clara_session=${token}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, "Alice");
});
