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

test("GET /candidates returns catalog overlay scoped to the session user", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const alice = await sessionFor(app, "alice@example.com", "Alice");
  const bob = await sessionFor(app, "bob@example.com", "Bob");

  await app.request("/api/clara/analyze", {
    method: "POST",
    headers: authHeaders(alice, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });

  const aliceList = await app.request("/api/candidates", { headers: authHeaders(alice) });
  const bobList = await app.request("/api/candidates", { headers: authHeaders(bob) });
  assert.equal(aliceList.status, 200);
  const aliceItems = (await aliceList.json()).items;
  const bobItems = (await bobList.json()).items;
  assert.equal(aliceItems.length, 3);
  const aliceMai = aliceItems.find((c: { id: string }) => c.id === "cand_01");
  const bobMai = bobItems.find((c: { id: string }) => c.id === "cand_01");
  assert.ok(aliceMai.overallCompatibility > 0);
  assert.equal(bobMai.overallCompatibility, 0);
  assert.equal(aliceMai.radarAxes.length, 7);
});

test("minCompleteness filters on the caller's analysis completeness", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");
  const empty = await app.request("/api/candidates?minCompleteness=70", {
    headers: authHeaders(token),
  });
  assert.equal((await empty.json()).items.length, 0);

  await app.request("/api/clara/analyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  const filtered = await app.request("/api/candidates?minCompleteness=1", {
    headers: authHeaders(token),
  });
  const items = (await filtered.json()).items;
  assert.ok(items.every((c: { dataCompleteness: number }) => c.dataCompleteness >= 1));
  assert.ok(items.some((c: { id: string }) => c.id === "cand_01"));
});

test("GET candidate detail 404s for unknown id", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");
  const res = await app.request("/api/candidates/cand_99", { headers: authHeaders(token) });
  assert.equal(res.status, 404);
});
