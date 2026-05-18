import { db } from "@workspace/db";
import { accountTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function getAccount(userId: string, email?: string) {
  const [row] = await db.select().from(accountTable).where(eq(accountTable.userId, userId));
  if (row) return row;

  const [created] = await db
    .insert(accountTable)
    .values({ userId, email: email ?? null, plan: "free" })
    .returning();
  return created!;
}

export async function updateAccount(
  userId: string,
  patch: Partial<typeof accountTable.$inferInsert>,
) {
  await getAccount(userId);
  const [updated] = await db
    .update(accountTable)
    .set(patch)
    .where(eq(accountTable.userId, userId))
    .returning();
  return updated!;
}
