import fs from "fs";
import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function resolvePglitePath(url: string): string {
  const raw = url.replace(/^pglite:\/\//, "");
  const resolved = path.isAbsolute(raw) ? raw : path.resolve(workspaceRoot, raw);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const isPglite = process.env.DATABASE_URL.startsWith("pglite:");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  ...(isPglite
    ? {
        driver: "pglite",
        dbCredentials: {
          url: resolvePglitePath(process.env.DATABASE_URL),
        },
      }
    : {
        dbCredentials: {
          url: process.env.DATABASE_URL,
        },
      }),
});
