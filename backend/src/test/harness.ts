import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { createApp } from "../app.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const openMigratedDb = () => {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  const dir = path.join(root, "db/migrations");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
  }
  return db;
};

export const json = (body: unknown) => JSON.stringify(body);

export const register = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json(body),
  });

export const login = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json(body),
  });

export const cookieFrom = (res: Response) => {
  const raw = res.headers.get("set-cookie") ?? "";
  const match = raw.match(/clara_session=([^;]+)/);
  return match?.[1] ?? "";
};

export const authHeaders = (token: string, extra?: HeadersInit) => ({
  Cookie: `clara_session=${token}`,
  ...extra,
});

export const sessionFor = async (
  app: ReturnType<typeof createApp>,
  email: string,
  name = "Tester"
) => {
  await register(app, { name, email, password: "Demo@1234" });
  const res = await login(app, { email, password: "Demo@1234" });
  return cookieFrom(res);
};
