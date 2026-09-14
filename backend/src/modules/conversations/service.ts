import type Database from "better-sqlite3";
import { claraService } from "../../ai/services/clara.service.js";
import { HttpError } from "../../shared/http.js";
import { newId } from "../../shared/ids.js";
import type { AppLocale } from "../../shared/locale.js";
import { sanitizeAgentHtml } from "../../shared/sanitize.js";
import { getCandidate, loadCatalog } from "../candidates/overlay.js";
import type { Questionnaire } from "../clara/engine.js";
import { ensureExploration } from "../explorations/service.js";
import { getPrivacy } from "../users/service.js";

const recentMessages = (db: Database.Database, explorationId: string) => {
  const rows = db
    .prepare(
      `SELECT sender, body AS text FROM chat_messages WHERE exploration_id = ? ORDER BY created_at DESC LIMIT 8`
    )
    .all(explorationId) as Array<{ sender: string; text: string }>;
  return rows.reverse();
};

const recentNotes = (db: Database.Database, explorationId: string) =>
  (
    db
      .prepare(
        `SELECT body FROM observation_notes WHERE exploration_id = ? ORDER BY created_at DESC LIMIT 10`
      )
      .all(explorationId) as Array<{ body: string }>
  ).map((row) => row.body);

export const chatWithClara = async (
  db: Database.Database,
  userId: string,
  locale: AppLocale,
  candidateId: string,
  text: string
) => {
  const trimmed = text.trim();
  if (!trimmed) throw new HttpError(400, "VALIDATION", "Message text is required");
  loadCatalog(db, locale, candidateId);
  const privacy = getPrivacy(db, userId);
  const exploration = ensureExploration(db, userId, candidateId);
  const candidate = getCandidate(db, userId, locale, candidateId);
  const catalog = loadCatalog(db, locale, candidateId)[0];
  const q = JSON.parse(catalog.questionnaireJson) as Questionnaire;
  const financeKnown = Boolean(q.financial_view && q.financial_view.trim());
  const reply = await claraService().chat(
    {
      locale,
      userText: trimmed,
      candidateName: candidate.name,
      overallCompatibility: candidate.overallCompatibility,
      icebreakers: candidate.icebreakers as string[],
      probingQuestions: candidate.probingQuestions as string[],
      nextDatePlan: candidate.nextDatePlan,
      financeKnown,
      recentMessages: recentMessages(db, exploration.id),
      notes: recentNotes(db, exploration.id),
    },
    { noTraining: privacy.noTraining }
  );
  const now = new Date().toISOString();
  const userMessage = { id: newId("msg"), sender: "user" as const, text: trimmed };
  const agentMessage = {
    id: newId("msg"),
    sender: "agent" as const,
    text: sanitizeAgentHtml(reply.text),
    recommendation: reply.recommendation,
  };
  if (!privacy.incognito) {
    db.prepare(
      `INSERT INTO chat_messages (id, exploration_id, sender, body, recommendation_json, created_at)
       VALUES (?, ?, 'user', ?, NULL, ?)`
    ).run(userMessage.id, exploration.id, userMessage.text, now);
    db.prepare(
      `INSERT INTO chat_messages (id, exploration_id, sender, body, recommendation_json, created_at)
       VALUES (?, ?, 'agent', ?, ?, ?)`
    ).run(
      agentMessage.id,
      exploration.id,
      agentMessage.text,
      reply.recommendation ? JSON.stringify(reply.recommendation) : null,
      now
    );
    db.prepare("UPDATE explorations SET updated_at = ? WHERE id = ?").run(now, exploration.id);
  }
  return { userMessage, agentMessage };
};

export const clearChat = (db: Database.Database, userId: string, candidateId: string) => {
  const row = db
    .prepare("SELECT id FROM explorations WHERE user_id = ? AND candidate_id = ?")
    .get(userId, candidateId) as { id: string } | undefined;
  if (!row) throw new HttpError(404, "NOT_FOUND", "Exploration not found");
  db.prepare("DELETE FROM chat_messages WHERE exploration_id = ?").run(row.id);
};
