import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { pool, pgliteClient, usePgliteDb } from "./pool";

export { pool, pgliteClient } from "./pool";

export const db = usePgliteDb
  ? drizzlePglite(pgliteClient!, { schema })
  : drizzlePg(pool!, { schema });

export async function closeDatabase(): Promise<void> {
  if (pool) await pool.end();
  if (pgliteClient) await pgliteClient.close();
}

export { ensureSchema } from "./ensure-schema";

export * from "./schema";
