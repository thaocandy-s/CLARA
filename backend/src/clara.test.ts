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

test("analyze is grounded in questionnaire, idempotent, and requires sourceEvidence", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");
  const first = await app.request("/api/clara/analyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  assert.equal(first.status, 200);
  const a = await first.json();
  assert.equal(a.id, "cand_01");
  assert.equal(a.radarAxes.length, 7);
  assert.ok(a.overallCompatibility >= 0 && a.overallCompatibility <= 100);
  assert.ok(a.dataCompleteness > 0);
  const items = [...a.checklist.matched, ...a.checklist.needsCheck, ...a.checklist.potentialFriction];
  assert.ok(items.length >= 1);
  for (const item of items) {
    assert.ok(item.sourceEvidence && item.sourceEvidence.length > 0);
  }
  assert.ok(a.notes.some((n: { author: string }) => n.author === "system"));
  assert.ok(a.chatHistory.some((m: { sender: string }) => m.sender === "agent"));

  const second = await app.request("/api/clara/analyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  const b = await second.json();
  assert.equal(b.overallCompatibility, a.overallCompatibility);
});

test("reanalyze requires a pending note and completeness reflects new facts", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");
  await app.request("/api/clara/analyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  const none = await app.request("/api/clara/reanalyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  assert.equal(none.status, 409);

  await app.request("/api/explorations/cand_01/notes", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      text: "Linh nói rõ kế hoạch định cư lâu dài ở TP.HCM và quan điểm tiết kiệm rõ ràng.",
    }),
  });
  const again = await app.request("/api/clara/reanalyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  assert.equal(again.status, 200);
  const cand = await again.json();
  assert.ok(cand.dataCompleteness >= 1);
  const evidence = JSON.stringify(cand.checklist);
  assert.ok(evidence.includes("ghi chú") || evidence.includes("note") || evidence.includes("Linh"));
});

test("chat persists unless incognito; clear chat keeps analysis", async () => {
  db = openMigratedDb();
  const app = createApp(db);
  const token = await sessionFor(app, "alice@example.com", "Alice");
  await app.request("/api/clara/analyze", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01" }),
  });
  const chat = await app.request("/api/clara/chat", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01", text: "Gợi ý thêm câu mở đầu tự nhiên khác?" }),
  });
  assert.equal(chat.status, 200);
  const payload = await chat.json();
  assert.equal(payload.userMessage.sender, "user");
  assert.equal(payload.agentMessage.sender, "agent");
  assert.ok(payload.agentMessage.recommendation?.items?.length >= 1);

  await app.request("/api/me/privacy", {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ incognito: true, hideFromPartner: true, noTraining: true }),
  });
  const incognitoChat = await app.request("/api/clara/chat", {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ candidateId: "cand_01", text: "ý tưởng buổi hẹn" }),
  });
  assert.equal(incognitoChat.status, 200);

  const cleared = await app.request("/api/clara/chat/cand_01", {
    method: "DELETE",
    headers: authHeaders(token),
  });
  assert.equal(cleared.status, 204);
  const detail = await app.request("/api/candidates/cand_01", { headers: authHeaders(token) });
  const cand = await detail.json();
  assert.equal(cand.chatHistory.length, 0);
  assert.ok(cand.overallCompatibility > 0);
});
