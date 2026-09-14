import "./load-env.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { describeActiveProvider } from "./ai/providers/index.js";
import Database from "better-sqlite3";
import { createApp } from "./app.js";
import { applyMigrations } from "./db/apply-migrations.js";
import { seedDemoUser } from "./modules/users/seed-demo.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DATABASE_PATH ?? path.join(dataDir, "clara.sqlite");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
applyMigrations(db);
seedDemoUser(db);

const app = createApp(db);
const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`CLARA API listening on http://localhost:${port}`);
  console.log(`Clara AI: ${describeActiveProvider()}`);
});
