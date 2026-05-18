import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";

const dbDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dbDir, "../../..");

function resolvePglitePath(url: string): string {
  const raw = url.replace(/^pglite:\/\//, "");
  const resolved = path.isAbsolute(raw) ? raw : path.resolve(workspaceRoot, raw);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const usePglite = process.env.DATABASE_URL.startsWith("pglite:");

export const pool = usePglite
  ? null
  : new Pool({ connectionString: process.env.DATABASE_URL });

const pgliteClient = usePglite
  ? new PGlite(resolvePglitePath(process.env.DATABASE_URL))
  : null;

export const db = usePglite
  ? drizzlePglite(pgliteClient!, { schema })
  : drizzlePg(pool!, { schema });

export async function closeDatabase(): Promise<void> {
  if (pool) await pool.end();
  if (pgliteClient) await pgliteClient.close();
}

export * from "./schema";
