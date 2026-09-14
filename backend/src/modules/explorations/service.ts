import type Database from "better-sqlite3";
import { HttpError } from "../../shared/http.js";
import { newId } from "../../shared/ids.js";
import type { AppLocale } from "../../shared/locale.js";
import { noteTimeLabel } from "../candidates/labels.js";
import { loadCatalog } from "../candidates/overlay.js";

export const ensureExploration = (db: Database.Database, userId: string, candidateId: string) => {
  loadCatalog(db, "vi", candidateId);
  const existing = db
    .prepare("SELECT id, stage FROM explorations WHERE user_id = ? AND candidate_id = ?")
    .get(userId, candidateId) as { id: string; stage: string } | undefined;
  if (existing) return existing;
  const now = new Date().toISOString();
  const id = newId("exp");
  db.prepare(
    `INSERT INTO explorations (id, user_id, candidate_id, stage, created_at, updated_at)
     VALUES (?, ?, ?, 'chatting', ?, ?)`
  ).run(id, userId, candidateId, now, now);
  return { id, stage: "chatting" };
};

export const requireOwnedExploration = (db: Database.Database, userId: string, candidateId: string) => {
  const row = db
    .prepare("SELECT id, stage FROM explorations WHERE user_id = ? AND candidate_id = ?")
    .get(userId, candidateId) as { id: string; stage: string } | undefined;
  if (!row) throw new HttpError(404, "NOT_FOUND", "Exploration not found");
  return row;
};

export const saveExploring = (db: Database.Database, userId: string, candidateId: string) => {
  const before = db
    .prepare("SELECT id FROM explorations WHERE user_id = ? AND candidate_id = ?")
    .get(userId, candidateId);
  const row = ensureExploration(db, userId, candidateId);
  return { created: !before, candidateId, stage: row.stage };
};

const setStage = (db: Database.Database, userId: string, candidateId: string, stage: string) => {
  loadCatalog(db, "vi", candidateId);
  const row = ensureExploration(db, userId, candidateId);
  const now = new Date().toISOString();
  db.prepare("UPDATE explorations SET stage = ?, updated_at = ? WHERE id = ?").run(stage, now, row.id);
  return { stage };
};

export const matchExploration = (db: Database.Database, userId: string, candidateId: string) =>
  setStage(db, userId, candidateId, "matched");

export const archiveExploration = (db: Database.Database, userId: string, candidateId: string) =>
  setStage(db, userId, candidateId, "archived");

export const addNote = (
  db: Database.Database,
  userId: string,
  candidateId: string,
  text: string,
  locale: AppLocale
) => {
  const trimmed = text.trim();
  if (!trimmed) throw new HttpError(400, "EMPTY_NOTE", "Note text is required");
  const exploration = ensureExploration(db, userId, candidateId);
  const now = new Date().toISOString();
  const id = newId("note");
  db.prepare(
    `INSERT INTO observation_notes (id, exploration_id, author, body, ingested_analysis_id, created_at)
     VALUES (?, ?, 'user', ?, NULL, ?)`
  ).run(id, exploration.id, trimmed, now);
  db.prepare("UPDATE explorations SET updated_at = ? WHERE id = ?").run(now, exploration.id);
  return {
    id,
    author: "user" as const,
    text: trimmed,
    timeLabel: noteTimeLabel(now, locale, "user"),
  };
};

export const pendingNotes = (db: Database.Database, explorationId: string) =>
  db
    .prepare(
      `SELECT id, body FROM observation_notes
       WHERE exploration_id = ? AND author = 'user' AND ingested_analysis_id IS NULL
       ORDER BY created_at ASC`
    )
    .all(explorationId) as Array<{ id: string; body: string }>;
