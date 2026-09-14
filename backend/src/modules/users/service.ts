import type Database from "better-sqlite3";
import { HttpError } from "../../shared/http.js";
import type { AppLocale } from "../../shared/locale.js";
import { ALLOWED_WEIGHT_KEYS } from "./defaults.js";

export type Weight = { key: string; label: string; value: number };

export type CriteriaDto = {
  name: string;
  age: number | null;
  city: string | null;
  intent: string | null;
  lifestyle: string | null;
  dealBreakers: string[];
  dealBreakerFlags: { no_smoking: boolean; long_term: boolean; pet_friendly: boolean };
  weights: Weight[];
  version: number;
};

const FLAG_LABELS: Record<AppLocale, Record<"no_smoking" | "long_term" | "pet_friendly", string>> = {
  vi: {
    no_smoking: "Không hút thuốc lá",
    long_term: "Hướng tới mối quan hệ lâu dài",
    pet_friendly: "Yêu động vật",
  },
  ja: {
    no_smoking: "禁煙",
    long_term: "長期的な関係を望む",
    pet_friendly: "動物が好き",
  },
};

type CriteriaRow = {
  name: string;
  age: number | null;
  city: string | null;
  intent: string | null;
  lifestyle: string | null;
  weightsJson: string;
  version: number;
  noSmoking: number;
  longTerm: number;
  petFriendly: number;
};

const mapRow = (row: CriteriaRow, locale: AppLocale): CriteriaDto => {
  const flags = {
    no_smoking: row.noSmoking === 1,
    long_term: row.longTerm === 1,
    pet_friendly: row.petFriendly === 1,
  };
  const labels = FLAG_LABELS[locale];
  const dealBreakers = (Object.keys(flags) as Array<keyof typeof flags>)
    .filter((key) => flags[key])
    .map((key) => labels[key]);
  return {
    name: row.name,
    age: row.age,
    city: row.city,
    intent: row.intent,
    lifestyle: row.lifestyle,
    dealBreakers,
    dealBreakerFlags: flags,
    weights: JSON.parse(row.weightsJson) as Weight[],
    version: row.version,
  };
};

const selectSql = `SELECT u.name, c.age, c.city, c.intent, c.lifestyle, c.weights_json AS weightsJson, c.version,
        c.deal_breaker_no_smoking AS noSmoking,
        c.deal_breaker_long_term AS longTerm,
        c.deal_breaker_pet_friendly AS petFriendly
 FROM users u
 JOIN user_criteria c ON c.user_id = u.id
 WHERE u.id = ?`;

export const getCriteria = (db: Database.Database, userId: string, locale: AppLocale): CriteriaDto => {
  const row = db.prepare(selectSql).get(userId) as CriteriaRow | undefined;
  if (!row) throw new HttpError(404, "NOT_FOUND", "Criteria not found");
  return mapRow(row, locale);
};

export const validateWeights = (weights: unknown): Weight[] => {
  if (!Array.isArray(weights) || weights.length < 1) {
    throw new HttpError(400, "VALIDATION", "Invalid weights");
  }
  return weights.map((item) => {
    if (!item || typeof item !== "object") throw new HttpError(400, "VALIDATION", "Invalid weights");
    const w = item as Weight;
    if (!ALLOWED_WEIGHT_KEYS.has(w.key)) throw new HttpError(400, "VALIDATION", "Unknown weight key");
    if (!Number.isInteger(w.value) || w.value < 0 || w.value > 100) {
      throw new HttpError(400, "VALIDATION", "Weight value must be an integer 0–100");
    }
    return { key: w.key, label: String(w.label ?? w.key), value: w.value };
  });
};

export const updateCriteria = (
  db: Database.Database,
  userId: string,
  locale: AppLocale,
  body: { weights?: unknown; dealBreakerFlags?: Record<string, boolean>; version?: number }
) => {
  const current = db
    .prepare("SELECT version, weights_json AS weightsJson FROM user_criteria WHERE user_id = ?")
    .get(userId) as { version: number; weightsJson: string } | undefined;
  if (!current) throw new HttpError(404, "NOT_FOUND", "Criteria not found");
  if (body.version !== undefined && body.version !== current.version) {
    throw new HttpError(409, "VERSION_CONFLICT", "Criteria were updated elsewhere");
  }
  const weights = body.weights === undefined ? (JSON.parse(current.weightsJson) as Weight[]) : validateWeights(body.weights);
  const flags = body.dealBreakerFlags ?? {};
  const now = new Date().toISOString();
  db.transaction(() => {
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
      userId
    );
    db.prepare(
      `UPDATE compatibility_analyses SET is_current = 0
       WHERE exploration_id IN (SELECT id FROM explorations WHERE user_id = ?)`
    ).run(userId);
  })();
  return getCriteria(db, userId, locale);
};

export const getPrivacy = (db: Database.Database, userId: string) => {
  const row = db
    .prepare(
      `SELECT incognito, hide_from_partner AS hideFromPartner, no_training AS noTraining
       FROM privacy_settings WHERE user_id = ?`
    )
    .get(userId) as { incognito: number; hideFromPartner: number; noTraining: number } | undefined;
  if (!row) throw new HttpError(404, "NOT_FOUND", "Privacy not found");
  return {
    incognito: row.incognito === 1,
    hideFromPartner: row.hideFromPartner === 1,
    noTraining: row.noTraining === 1,
  };
};

export const updatePrivacy = (
  db: Database.Database,
  userId: string,
  body: { incognito?: unknown; hideFromPartner?: unknown; noTraining?: unknown }
) => {
  if (
    typeof body.incognito !== "boolean" ||
    typeof body.hideFromPartner !== "boolean" ||
    typeof body.noTraining !== "boolean"
  ) {
    throw new HttpError(400, "VALIDATION", "Privacy flags must be booleans");
  }
  db.prepare(
    `UPDATE privacy_settings SET incognito = ?, hide_from_partner = ?, no_training = ?, updated_at = ?
     WHERE user_id = ?`
  ).run(body.incognito ? 1 : 0, body.hideFromPartner ? 1 : 0, body.noTraining ? 1 : 0, new Date().toISOString(), userId);
  return getPrivacy(db, userId);
};

export const deleteAnalysisHistory = (db: Database.Database, userId: string) => {
  db.prepare("DELETE FROM explorations WHERE user_id = ?").run(userId);
};
