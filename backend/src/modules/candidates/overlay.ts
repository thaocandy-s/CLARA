import type Database from "better-sqlite3";
import { HttpError } from "../../shared/http.js";
import type { AppLocale } from "../../shared/locale.js";
import { emptyRadar, noteTimeLabel, relativeSavedLabel, STAGE_LABELS } from "./labels.js";

export type CatalogRow = {
  id: string;
  age: number;
  distanceKm: number;
  gradient: string;
  name: string;
  job: string;
  location: string;
  bio: string;
  tagsJson: string;
  questionnaireJson: string;
};

export const loadCatalog = (db: Database.Database, locale: AppLocale, candidateId?: string) => {
  const sql = `SELECT c.id, c.age, c.distance_km AS distanceKm, c.gradient,
                i.name, i.job, i.location, i.bio, i.tags_json AS tagsJson,
                i.questionnaire_json AS questionnaireJson
         FROM candidates c
         JOIN candidate_i18n i ON i.candidate_id = c.id AND i.locale = ?
         ${candidateId ? "WHERE c.id = ?" : ""}
         ORDER BY c.id ASC`;
  if (candidateId) {
    const row = db.prepare(sql).get(locale, candidateId) as CatalogRow | undefined;
    if (!row) throw new HttpError(404, "NOT_FOUND", "Candidate not found");
    return [row];
  }
  return db.prepare(sql).all(locale) as CatalogRow[];
};

export const emptyOverlay = (locale: AppLocale) => ({
  overallCompatibility: 0,
  dataCompleteness: 0,
  confidenceLabel: "",
  matchLabel: "",
  matchBadgeTone: "check" as const,
  aiQuickSummary: { positive: "", question: "" },
  compareRows: [] as unknown[],
  radarAxes: emptyRadar(locale),
  checklist: { matched: [], needsCheck: [], potentialFriction: [] },
  icebreakers: [] as string[],
  probingQuestions: [] as string[],
  chatHistory: [] as unknown[],
  stage: "chatting" as const,
  stageLabel: STAGE_LABELS[locale].chatting,
  savedLabel: relativeSavedLabel(undefined, locale),
  notes: [] as unknown[],
  nextDatePlan: { title: "", detail: "" },
});

type ExplorationBits = {
  id: string;
  stage: string;
  updatedAt: string;
};

export const loadExploration = (db: Database.Database, userId: string, candidateId: string) =>
  db
    .prepare(
      `SELECT id, stage, updated_at AS updatedAt FROM explorations WHERE user_id = ? AND candidate_id = ?`
    )
    .get(userId, candidateId) as ExplorationBits | undefined;

const loadCurrentPayload = (db: Database.Database, explorationId: string) => {
  const row = db
    .prepare(
      `SELECT payload_json AS payloadJson, overall_compatibility AS overallCompatibility,
              data_completeness AS dataCompleteness
       FROM compatibility_analyses WHERE exploration_id = ? AND is_current = 1`
    )
    .get(explorationId) as
    | { payloadJson: string; overallCompatibility: number; dataCompleteness: number }
    | undefined;
  return row;
};

const loadNotes = (db: Database.Database, explorationId: string, locale: AppLocale) => {
  const rows = db
    .prepare(
      `SELECT id, author, body, created_at AS createdAt
       FROM observation_notes WHERE exploration_id = ? ORDER BY created_at DESC`
    )
    .all(explorationId) as Array<{ id: string; author: string; body: string; createdAt: string }>;
  return rows.map((n) => ({
    id: n.id,
    author: n.author,
    text: n.body,
    timeLabel: noteTimeLabel(n.createdAt, locale, n.author),
  }));
};

const loadChat = (db: Database.Database, explorationId: string) => {
  const rows = db
    .prepare(
      `SELECT id, sender, body, recommendation_json AS recommendationJson
       FROM chat_messages WHERE exploration_id = ? ORDER BY created_at ASC`
    )
    .all(explorationId) as Array<{
    id: string;
    sender: string;
    body: string;
    recommendationJson: string | null;
  }>;
  return rows.map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.body,
    ...(m.recommendationJson ? { recommendation: JSON.parse(m.recommendationJson) } : {}),
  }));
};

export const assembleCandidate = (
  db: Database.Database,
  userId: string,
  locale: AppLocale,
  catalog: CatalogRow
) => {
  const exploration = loadExploration(db, userId, catalog.id);
  const overlay = emptyOverlay(locale);
  const base = {
    id: catalog.id,
    name: catalog.name,
    age: catalog.age,
    job: catalog.job,
    location: catalog.location,
    distanceKm: catalog.distanceKm,
    bio: catalog.bio,
    tags: JSON.parse(catalog.tagsJson) as string[],
    gradient: catalog.gradient,
    ...overlay,
  };
  if (!exploration) return base;
  const current = loadCurrentPayload(db, exploration.id);
  const payload = current ? (JSON.parse(current.payloadJson) as Record<string, unknown>) : {};
  return {
    ...base,
    ...payload,
    overallCompatibility: current?.overallCompatibility ?? 0,
    dataCompleteness: current?.dataCompleteness ?? 0,
    id: catalog.id,
    name: catalog.name,
    age: catalog.age,
    job: catalog.job,
    location: catalog.location,
    distanceKm: catalog.distanceKm,
    bio: catalog.bio,
    tags: JSON.parse(catalog.tagsJson) as string[],
    gradient: catalog.gradient,
    stage: exploration.stage,
    stageLabel: STAGE_LABELS[locale][exploration.stage] ?? exploration.stage,
    savedLabel: relativeSavedLabel(exploration.updatedAt, locale),
    notes: loadNotes(db, exploration.id, locale),
    chatHistory: loadChat(db, exploration.id),
  };
};

export const listCandidates = (
  db: Database.Database,
  userId: string,
  locale: AppLocale,
  minCompleteness?: number
) => {
  const items = loadCatalog(db, locale).map((row) => assembleCandidate(db, userId, locale, row));
  if (minCompleteness === undefined) return items;
  return items.filter((c) => c.dataCompleteness >= minCompleteness);
};

export const getCandidate = (db: Database.Database, userId: string, locale: AppLocale, candidateId: string) => {
  const [row] = loadCatalog(db, locale, candidateId);
  return assembleCandidate(db, userId, locale, row);
};
