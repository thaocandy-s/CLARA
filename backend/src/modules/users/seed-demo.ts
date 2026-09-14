import type Database from "better-sqlite3";
import { hashPassword } from "../../security/password.js";
import { DEFAULT_WEIGHTS } from "./defaults.js";

export const DEMO_EMAIL = "demo@clara.app";
export const DEMO_NAME = "Nghi yeu Duc";
export const DEMO_PASSWORD = "Demo@1234";

export const seedDemoUser = (db: Database.Database) => {
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE")
    .get(DEMO_EMAIL);
  if (existing) return false;

  const now = new Date().toISOString();
  const userId = "usr_demo";
  db.transaction(() => {
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, DEMO_EMAIL, DEMO_NAME, hashPassword(DEMO_PASSWORD), now);

    db.prepare(
      `INSERT INTO user_criteria (
        user_id, age, city, intent, lifestyle,
        deal_breaker_no_smoking, deal_breaker_long_term, deal_breaker_pet_friendly,
        weights_json, version, updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, 1, 1, ?, 1, ?, ?)`
    ).run(
      userId,
      28,
      "Hà Nội",
      "Nghiêm túc, kết hôn trong 2-3 năm",
      "Dậy sớm, chạy bộ, cafe sáng, coi trọng sự nghiệp",
      JSON.stringify(DEFAULT_WEIGHTS),
      now,
      now
    );

    db.prepare(
      `INSERT INTO privacy_settings (user_id, incognito, hide_from_partner, no_training, updated_at)
       VALUES (?, 0, 1, 1, ?)`
    ).run(userId, now);
  })();
  return true;
};
