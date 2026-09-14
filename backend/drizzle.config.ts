import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./db/drizzle-meta",
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? "./data/clara.sqlite",
  },
});
