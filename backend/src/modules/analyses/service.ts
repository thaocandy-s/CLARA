import type Database from "better-sqlite3";
import { claraService } from "../../ai/services/clara.service.js";
import type { AnalysisResult } from "../../ai/schemas/analysis.js";
import { HttpError } from "../../shared/http.js";
import { newId } from "../../shared/ids.js";
import type { AppLocale } from "../../shared/locale.js";
import { getCandidate, loadCatalog } from "../candidates/overlay.js";
import { ensureExploration, pendingNotes } from "../explorations/service.js";
import { getCriteria, getPrivacy } from "../users/service.js";
import type { Questionnaire } from "../clara/engine.js";
import { sanitizeAgentHtml } from "../../shared/sanitize.js";

const insertSystemNote = (db: Database.Database, explorationId: string, locale: AppLocale) => {
  const text =
    locale === "ja"
      ? "公開プロフィールとあなたの基準で初期分析を作成しました。"
      : "Khởi tạo phân tích ban đầu từ hồ sơ công khai và tiêu chí của bạn.";
  db.prepare(
    `INSERT INTO observation_notes (id, exploration_id, author, body, ingested_analysis_id, created_at)
     VALUES (?, ?, 'system', ?, NULL, ?)`
  ).run(newId("note"), explorationId, text, new Date().toISOString());
};

const insertWelcome = (db: Database.Database, explorationId: string, html: string) => {
  db.prepare(
    `INSERT INTO chat_messages (id, exploration_id, sender, body, recommendation_json, created_at)
     VALUES (?, ?, 'agent', ?, NULL, ?)`
  ).run(newId("msg"), explorationId, sanitizeAgentHtml(html), new Date().toISOString());
};

const currentAnalysis = (db: Database.Database, explorationId: string) =>
  db
    .prepare(
      `SELECT id, criteria_version AS criteriaVersion, locale, payload_json AS payloadJson
       FROM compatibility_analyses WHERE exploration_id = ? AND is_current = 1`
    )
    .get(explorationId) as
    | { id: string; criteriaVersion: number; locale: string; payloadJson: string }
    | undefined;

const persistAnalysis = (
  db: Database.Database,
  explorationId: string,
  criteriaVersion: number,
  locale: AppLocale,
  result: AnalysisResult,
  previousId: string | null
) => {
  const id = newId("anly");
  const now = new Date().toISOString();
  db.prepare(`UPDATE compatibility_analyses SET is_current = 0 WHERE exploration_id = ?`).run(explorationId);
  db.prepare(
    `INSERT INTO compatibility_analyses (
      id, exploration_id, criteria_version, locale, overall_compatibility, data_completeness,
      is_current, previous_analysis_id, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  ).run(
    id,
    explorationId,
    criteriaVersion,
    locale,
    result.overallCompatibility,
    result.dataCompleteness,
    previousId,
    JSON.stringify(result.payload),
    now
  );
  db.prepare("UPDATE explorations SET updated_at = ? WHERE id = ?").run(now, explorationId);
  return id;
};

export const analyzeCandidate = async (
  db: Database.Database,
  userId: string,
  locale: AppLocale,
  candidateId: string
) => {
  const [catalog] = loadCatalog(db, locale, candidateId);
  const criteria = getCriteria(db, userId, locale);
  const exploration = ensureExploration(db, userId, candidateId);
  const pending = pendingNotes(db, exploration.id);
  const current = currentAnalysis(db, exploration.id);
  if (current && current.criteriaVersion === criteria.version && current.locale === locale && pending.length === 0) {
    return getCandidate(db, userId, locale, candidateId);
  }

  const questionnaire = JSON.parse(catalog.questionnaireJson) as Questionnaire;
  const privacy = getPrivacy(db, userId);
  const result = await claraService().analyze(
    {
      locale,
      userName: criteria.name,
      criteria,
      candidate: {
        id: catalog.id,
        name: catalog.name,
        job: catalog.job,
        bio: catalog.bio,
        tags: JSON.parse(catalog.tagsJson) as string[],
        questionnaire,
      },
      pendingNotes: pending.map((n) => n.body),
    },
    { noTraining: privacy.noTraining }
  );

  const firstTime = !current;
  db.transaction(() => {
    persistAnalysis(db, exploration.id, criteria.version, locale, result, current?.id ?? null);
    if (firstTime) {
      insertSystemNote(db, exploration.id, locale);
      insertWelcome(db, exploration.id, result.welcomeHtml);
    }
    for (const note of pending) {
      const latest = db
        .prepare(`SELECT id FROM compatibility_analyses WHERE exploration_id = ? AND is_current = 1`)
        .get(exploration.id) as { id: string };
      db.prepare(`UPDATE observation_notes SET ingested_analysis_id = ? WHERE id = ?`).run(latest.id, note.id);
    }
  })();

  return getCandidate(db, userId, locale, candidateId);
};

export const reanalyzeCandidate = async (
  db: Database.Database,
  userId: string,
  locale: AppLocale,
  candidateId: string
) => {
  const [catalog] = loadCatalog(db, locale, candidateId);
  const exploration = db
    .prepare("SELECT id FROM explorations WHERE user_id = ? AND candidate_id = ?")
    .get(userId, candidateId) as { id: string } | undefined;
  if (!exploration) throw new HttpError(404, "NOT_FOUND", "Exploration not found");
  const pending = pendingNotes(db, exploration.id);
  if (pending.length === 0) throw new HttpError(409, "NO_PENDING_NOTES", "Add an observation note before reanalyze");
  const current = currentAnalysis(db, exploration.id);
  if (!current) throw new HttpError(409, "NO_PENDING_NOTES", "Analyze first");
  const criteria = getCriteria(db, userId, locale);
  const questionnaire = JSON.parse(catalog.questionnaireJson) as Questionnaire;
  const privacy = getPrivacy(db, userId);
  const previousPayload = JSON.parse(current.payloadJson) as AnalysisResult["payload"];
  const result = await claraService().reanalyze(
    {
      locale,
      userName: criteria.name,
      criteria,
      candidate: {
        id: catalog.id,
        name: catalog.name,
        job: catalog.job,
        bio: catalog.bio,
        tags: JSON.parse(catalog.tagsJson) as string[],
        questionnaire,
      },
      pendingNotes: pending.map((n) => n.body),
    },
    previousPayload,
    { noTraining: privacy.noTraining }
  );
  db.transaction(() => {
    const analysisId = persistAnalysis(db, exploration.id, criteria.version, locale, result, current.id);
    for (const note of pending) {
      db.prepare(`UPDATE observation_notes SET ingested_analysis_id = ? WHERE id = ?`).run(analysisId, note.id);
    }
  })();
  return getCandidate(db, userId, locale, candidateId);
};
