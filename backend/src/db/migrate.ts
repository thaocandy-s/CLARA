import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applyMigrations } from "./apply-migrations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(root, "data");
const dbPath = process.env.DATABASE_PATH ?? path.join(dataDir, "clara.sqlite");

fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
applyMigrations(db);
db.close();
console.log(`database ready: ${dbPath}`);
