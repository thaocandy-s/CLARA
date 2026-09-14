import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/** Application users. Password is stored hashed only. */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [uniqueIndex("ux_users_email").on(t.email)]
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("ux_sessions_token_hash").on(t.tokenHash),
    index("ix_sessions_user_id").on(t.userId),
    index("ix_sessions_expires_at").on(t.expiresAt),
  ]
);

export const userCriteria = sqliteTable("user_criteria", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  city: text("city"),
  intent: text("intent"),
  lifestyle: text("lifestyle"),
  dealBreakerNoSmoking: integer("deal_breaker_no_smoking").notNull().default(1),
  dealBreakerLongTerm: integer("deal_breaker_long_term").notNull().default(1),
  dealBreakerPetFriendly: integer("deal_breaker_pet_friendly").notNull().default(1),
  weightsJson: text("weights_json").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const privacySettings = sqliteTable("privacy_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  incognito: integer("incognito").notNull().default(0),
  hideFromPartner: integer("hide_from_partner").notNull().default(1),
  noTraining: integer("no_training").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey(),
  age: integer("age").notNull(),
  distanceKm: real("distance_km").notNull(),
  gradient: text("gradient").notNull(),
  createdAt: text("created_at").notNull(),
});

export const candidateI18n = sqliteTable(
  "candidate_i18n",
  {
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "restrict" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    job: text("job").notNull(),
    location: text("location").notNull(),
    bio: text("bio").notNull(),
    tagsJson: text("tags_json").notNull(),
    questionnaireJson: text("questionnaire_json").notNull().default("{}"),
  },
  (t) => [primaryKey({ columns: [t.candidateId, t.locale] })]
);

export const explorations = sqliteTable(
  "explorations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "restrict" }),
    stage: text("stage").notNull().default("chatting"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("ux_explorations_user_candidate").on(t.userId, t.candidateId),
    index("ix_explorations_user_id").on(t.userId),
  ]
);

export const compatibilityAnalyses = sqliteTable(
  "compatibility_analyses",
  {
    id: text("id").primaryKey(),
    explorationId: text("exploration_id")
      .notNull()
      .references(() => explorations.id, { onDelete: "cascade" }),
    criteriaVersion: integer("criteria_version").notNull(),
    locale: text("locale").notNull(),
    overallCompatibility: integer("overall_compatibility").notNull(),
    dataCompleteness: integer("data_completeness").notNull(),
    isCurrent: integer("is_current").notNull().default(1),
    previousAnalysisId: text("previous_analysis_id"),
    payloadJson: text("payload_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("ix_analyses_exploration").on(t.explorationId),
    uniqueIndex("ux_analyses_one_current")
      .on(t.explorationId)
      .where(sql`${t.isCurrent} = 1`),
  ]
);

export const observationNotes = sqliteTable(
  "observation_notes",
  {
    id: text("id").primaryKey(),
    explorationId: text("exploration_id")
      .notNull()
      .references(() => explorations.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    body: text("body").notNull(),
    ingestedAnalysisId: text("ingested_analysis_id"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("ix_notes_exploration_created").on(t.explorationId, t.createdAt)]
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    explorationId: text("exploration_id")
      .notNull()
      .references(() => explorations.id, { onDelete: "cascade" }),
    sender: text("sender").notNull(),
    body: text("body").notNull(),
    recommendationJson: text("recommendation_json"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("ix_chat_exploration_created").on(t.explorationId, t.createdAt)]
);

export const schemaMigrations = sqliteTable("schema_migrations", {
  version: text("version").primaryKey(),
  appliedAt: text("applied_at").notNull(),
});
