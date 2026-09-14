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

test("save, match, archive update stage; notes reject empty text", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");

  const save = await app.request("/api/explorations/cand_01", {
    method: "POST",
    headers: authHeaders(token),
  });
  assert.equal(save.status, 201);
  assert.equal((await save.json()).stage, "chatting");

  const match = await app.request("/api/explorations/cand_01/match", {
    method: "POST",
    headers: authHeaders(token),
  });
  assert.equal((await match.json()).stage, "matched");

  const archive = await app.request("/api/explorations/cand_01/archive", {
    method: "POST",
    headers: authHeaders(token),
  });
  assert.equal((await archive.json()).stage, "archived");

  const empty = await app.request("/api/explorations/cand_01/notes", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ text: "   " }),
  });
  assert.equal(empty.status, 400);

  const note = await app.request("/api/explorations/cand_01/notes", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ text: "Sau cafe, Linh muốn ở HCM lâu dài." }),
  });
  assert.equal(note.status, 201);
  const body = await note.json();
  assert.equal(body.author, "user");
  assert.ok(body.text.includes("HCM"));
});

test("explorations of another user are not readable (404 on match without own row is still allowed to create)", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const alice = await sessionFor(app, "alice@example.com", "Alice");
  const bob = await sessionFor(app, "bob@example.com", "Bob");
  await app.request("/api/explorations/cand_01/notes", {
    method: "POST",
    headers: authHeaders(alice, { "Content-Type": "application/json" }),
    body: JSON.stringify({ text: "ghi chú riêng của Alice" }),
  });
  const bobDetail = await app.request("/api/candidates/cand_01", { headers: authHeaders(bob) });
  const cand = await bobDetail.json();
  assert.ok(!JSON.stringify(cand.notes).includes("Alice"));
});
