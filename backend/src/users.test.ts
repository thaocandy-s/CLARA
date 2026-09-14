import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type Database from "better-sqlite3";
import { createApp } from "./app.js";
import { authHeaders, openMigratedDb, sessionFor } from "./test/harness.js";

let db: Database.Database | undefined;

afterEach(() => {
  db?.close();
  db = undefined;
});

test("register rejects password shorter than 8 characters", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "A", email: "a@example.com", password: "short7" }),
  });
  assert.equal(res.status, 400);
});

test("GET criteria returns deal-breaker strings from flags; PUT validates weights", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");
  const get = await app.request("/api/me/criteria", { headers: authHeaders(token) });
  assert.equal(get.status, 200);
  const criteria = await get.json();
  assert.ok(Array.isArray(criteria.dealBreakers));
  assert.ok(criteria.dealBreakers.length >= 1);
  assert.equal(criteria.dealBreakerFlags.no_smoking, true);

  const bad = await app.request("/api/me/criteria", {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      weights: [{ key: "long_term_goals", label: "x", value: 101 }],
      dealBreakerFlags: { no_smoking: false, long_term: true, pet_friendly: true },
    }),
  });
  assert.equal(bad.status, 400);

  const ok = await app.request("/api/me/criteria", {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      weights: [{ key: "long_term_goals", label: "Mục tiêu", value: 40 }],
      dealBreakerFlags: { no_smoking: false, long_term: true, pet_friendly: true },
    }),
  });
  assert.equal(ok.status, 200);
  const saved = await ok.json();
  assert.equal(saved.dealBreakerFlags.no_smoking, false);
  assert.equal(saved.version, 2);
  assert.ok(!saved.dealBreakers.includes("Không hút thuốc lá"));
});

test("PUT privacy requires booleans; delete history does not remove account or candidates", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");
  const bad = await app.request("/api/me/privacy", {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ incognito: "yes" }),
  });
  assert.equal(bad.status, 400);

  const ok = await app.request("/api/me/privacy", {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ incognito: true, hideFromPartner: true, noTraining: true }),
  });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).incognito, true);

  await app.request("/api/clara/analyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  const del = await app.request("/api/me/analysis-history", {
    method: "DELETE",
    headers: authHeaders(token),
  });
  assert.equal(del.status, 204);
  const me = await app.request("/api/me", { headers: authHeaders(token) });
  assert.equal(me.status, 200);
  const catalog = db!.prepare("SELECT COUNT(*) AS n FROM candidates").get() as { n: number };
  assert.equal(catalog.n, 3);
});
