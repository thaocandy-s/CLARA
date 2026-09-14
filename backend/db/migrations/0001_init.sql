-- CLARA Matching Coach — initial schema (SQLite)
-- Caller must set PRAGMA foreign_keys = ON.

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT ck_users_email_len CHECK (length(trim(email)) >= 3),
  CONSTRAINT ck_users_email_at CHECK (instr(email, '@') > 1),
  CONSTRAINT ck_users_name CHECK (length(trim(name)) >= 1),
  CONSTRAINT ck_users_password_hash CHECK (length(password_hash) >= 20)
);

CREATE UNIQUE INDEX ux_users_email ON users (email COLLATE NOCASE);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT ck_sessions_token CHECK (length(token_hash) >= 32),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ux_sessions_token_hash ON sessions (token_hash);
CREATE INDEX ix_sessions_user_id ON sessions (user_id);
CREATE INDEX ix_sessions_expires_at ON sessions (expires_at);

CREATE TABLE user_criteria (
  user_id TEXT PRIMARY KEY NOT NULL,
  age INTEGER,
  city TEXT,
  intent TEXT,
  lifestyle TEXT,
  deal_breaker_no_smoking INTEGER NOT NULL DEFAULT 1,
  deal_breaker_long_term INTEGER NOT NULL DEFAULT 1,
  deal_breaker_pet_friendly INTEGER NOT NULL DEFAULT 1,
  weights_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT ck_criteria_smoking CHECK (deal_breaker_no_smoking IN (0, 1)),
  CONSTRAINT ck_criteria_long_term CHECK (deal_breaker_long_term IN (0, 1)),
  CONSTRAINT ck_criteria_pets CHECK (deal_breaker_pet_friendly IN (0, 1)),
  CONSTRAINT ck_criteria_version CHECK (version >= 1),
  CONSTRAINT ck_criteria_weights CHECK (json_valid(weights_json)),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE privacy_settings (
  user_id TEXT PRIMARY KEY NOT NULL,
  incognito INTEGER NOT NULL DEFAULT 0,
  hide_from_partner INTEGER NOT NULL DEFAULT 1,
  no_training INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_privacy_incognito CHECK (incognito IN (0, 1)),
  CONSTRAINT ck_privacy_hide CHECK (hide_from_partner IN (0, 1)),
  CONSTRAINT ck_privacy_no_train CHECK (no_training IN (0, 1)),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE candidates (
  id TEXT PRIMARY KEY NOT NULL,
  age INTEGER NOT NULL,
  distance_km REAL NOT NULL,
  gradient TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT ck_candidates_id CHECK (id LIKE 'cand_%'),
  CONSTRAINT ck_candidates_age CHECK (age BETWEEN 18 AND 120),
  CONSTRAINT ck_candidates_distance CHECK (distance_km >= 0)
);

CREATE TABLE candidate_i18n (
  candidate_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  job TEXT NOT NULL,
  location TEXT NOT NULL,
  bio TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  questionnaire_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (candidate_id, locale),
  CONSTRAINT ck_i18n_locale CHECK (locale IN ('vi', 'ja')),
  CONSTRAINT ck_i18n_name CHECK (length(trim(name)) >= 1),
  CONSTRAINT ck_i18n_tags CHECK (json_valid(tags_json)),
  CONSTRAINT ck_i18n_q CHECK (json_valid(questionnaire_json)),
  FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT
);

CREATE TABLE explorations (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'chatting',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_explorations_stage CHECK (
    stage IN ('matched', 'chatting', 'met-once', 'archived')
  ),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ux_explorations_user_candidate ON explorations (user_id, candidate_id);
CREATE INDEX ix_explorations_user_id ON explorations (user_id);

CREATE TABLE compatibility_analyses (
  id TEXT PRIMARY KEY NOT NULL,
  exploration_id TEXT NOT NULL,
  criteria_version INTEGER NOT NULL,
  locale TEXT NOT NULL,
  overall_compatibility INTEGER NOT NULL,
  data_completeness INTEGER NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 1,
  previous_analysis_id TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT ck_analyses_version CHECK (criteria_version >= 1),
  CONSTRAINT ck_analyses_locale CHECK (locale IN ('vi', 'ja')),
  CONSTRAINT ck_analyses_compat CHECK (overall_compatibility BETWEEN 0 AND 100),
  CONSTRAINT ck_analyses_complete CHECK (data_completeness BETWEEN 0 AND 100),
  CONSTRAINT ck_analyses_current CHECK (is_current IN (0, 1)),
  CONSTRAINT ck_analyses_payload CHECK (json_valid(payload_json)),
  FOREIGN KEY (exploration_id) REFERENCES explorations (id) ON DELETE CASCADE,
  FOREIGN KEY (previous_analysis_id) REFERENCES compatibility_analyses (id) ON DELETE SET NULL
);

CREATE INDEX ix_analyses_exploration ON compatibility_analyses (exploration_id);
CREATE UNIQUE INDEX ux_analyses_one_current
  ON compatibility_analyses (exploration_id)
  WHERE is_current = 1;

CREATE TABLE observation_notes (
  id TEXT PRIMARY KEY NOT NULL,
  exploration_id TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  ingested_analysis_id TEXT,
  created_at TEXT NOT NULL,
  CONSTRAINT ck_notes_author CHECK (author IN ('user', 'system')),
  CONSTRAINT ck_notes_body CHECK (length(trim(body)) >= 1),
  FOREIGN KEY (exploration_id) REFERENCES explorations (id) ON DELETE CASCADE,
  FOREIGN KEY (ingested_analysis_id) REFERENCES compatibility_analyses (id) ON DELETE SET NULL
);

CREATE INDEX ix_notes_exploration_created ON observation_notes (exploration_id, created_at DESC);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  exploration_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  recommendation_json TEXT,
  created_at TEXT NOT NULL,
  CONSTRAINT ck_chat_sender CHECK (sender IN ('agent', 'user')),
  CONSTRAINT ck_chat_body CHECK (length(trim(body)) >= 1),
  CONSTRAINT ck_chat_reco CHECK (
    recommendation_json IS NULL OR json_valid(recommendation_json)
  ),
  FOREIGN KEY (exploration_id) REFERENCES explorations (id) ON DELETE CASCADE
);

CREATE INDEX ix_chat_exploration_created ON chat_messages (exploration_id, created_at);
