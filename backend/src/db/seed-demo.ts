import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { seedDemoUser } from "../modules/users/seed-demo.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dbPath = process.env.DATABASE_PATH ?? path.join(root, "data/clara.sqlite");

if (!fs.existsSync(dbPath)) {
  console.error("Database file missing. Run npm run db:migrate first.");
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
const created = seedDemoUser(db);
db.close();
console.log(created ? `seeded demo@clara.app` : "demo user already exists");
