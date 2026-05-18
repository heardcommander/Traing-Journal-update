import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { ritualsTable, ritualCompletionsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import {
  CreateRitualBody,
  UpdateRitualBody,
  UpdateRitualParams,
  DeleteRitualParams,
  CreateRitualCompletionBody,
  DeleteRitualCompletionParams,
  ListRitualCompletionsQueryParams,
} from "@workspace/api-zod";
import type { AuthedRequest } from "../middleware/auth";

const router = Router();

function userId(req: Request) {
  return (req as AuthedRequest).userId;
}

function toRitualResponse(r: typeof ritualsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

function toCompletionResponse(c: typeof ritualCompletionsTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

router.get("/rituals", async (req, res) => {
  const rows = await db
    .select()
    .from(ritualsTable)
    .where(eq(ritualsTable.userId, userId(req)))
    .orderBy(ritualsTable.createdAt);
  res.json(rows.map(toRitualResponse));
});

router.post("/rituals", async (req, res) => {
  const body = CreateRitualBody.parse(req.body);
  const [created] = await db
    .insert(ritualsTable)
    .values({ userId: userId(req), label: body.label })
    .returning();
  res.status(201).json(toRitualResponse(created));
});

router.patch("/rituals/:id", async (req, res) => {
  const uid = userId(req);
  const { id } = UpdateRitualParams.parse({ id: parseInt(req.params.id, 10) });
  const body = UpdateRitualBody.parse(req.body);
  const updateData: Partial<typeof ritualsTable.$inferInsert> = {};
  if (body.label !== undefined) updateData.label = body.label;

  const [updated] = await db
    .update(ritualsTable)
    .set(updateData)
    .where(and(eq(ritualsTable.id, id), eq(ritualsTable.userId, uid)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Ritual not found" });
  res.json(toRitualResponse(updated));
});

router.delete("/rituals/:id", async (req, res) => {
  const uid = userId(req);
  const { id } = DeleteRitualParams.parse({ id: parseInt(req.params.id, 10) });
  const [deleted] = await db
    .delete(ritualsTable)
    .where(and(eq(ritualsTable.id, id), eq(ritualsTable.userId, uid)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "Ritual not found" });
  res.status(204).end();
});

router.get("/ritual-completions", async (req, res) => {
  const uid = userId(req);
  const query = ListRitualCompletionsQueryParams.safeParse(req.query);
  const date =
    query.success && query.data.date ? query.data.date : new Date().toISOString().slice(0, 10);

  const userRituals = await db
    .select({ id: ritualsTable.id })
    .from(ritualsTable)
    .where(eq(ritualsTable.userId, uid));
  const ritualIds = new Set(userRituals.map((r) => r.id));

  const rows = await db
    .select()
    .from(ritualCompletionsTable)
    .where(eq(ritualCompletionsTable.completedDate, date));

  res.json(rows.filter((r) => ritualIds.has(r.ritualId)).map(toCompletionResponse));
});

router.post("/ritual-completions", async (req, res) => {
  const uid = userId(req);
  const body = CreateRitualCompletionBody.parse(req.body);

  const [ritual] = await db
    .select()
    .from(ritualsTable)
    .where(and(eq(ritualsTable.id, body.ritualId), eq(ritualsTable.userId, uid)));
  if (!ritual) return res.status(404).json({ error: "Ritual not found" });

  const completedDate = body.completedDate ?? new Date().toISOString().slice(0, 10);
  const [created] = await db
    .insert(ritualCompletionsTable)
    .values({ ritualId: body.ritualId, completedDate })
    .returning();
  res.status(201).json(toCompletionResponse(created));
});

router.delete("/ritual-completions/:id", async (req, res) => {
  const uid = userId(req);
  const { id } = DeleteRitualCompletionParams.parse({ id: parseInt(req.params.id, 10) });
  const [completion] = await db
    .select()
    .from(ritualCompletionsTable)
    .where(eq(ritualCompletionsTable.id, id));
  if (!completion) return res.status(404).json({ error: "Completion not found" });

  const [ritual] = await db
    .select()
    .from(ritualsTable)
    .where(and(eq(ritualsTable.id, completion.ritualId), eq(ritualsTable.userId, uid)));
  if (!ritual) return res.status(404).json({ error: "Completion not found" });

  await db.delete(ritualCompletionsTable).where(eq(ritualCompletionsTable.id, id));
  res.status(204).end();
});

export default router;
