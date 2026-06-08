import { Router } from "express";
import { db } from "@workspace/db";
import { ritualsTable, ritualCompletionsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveUserId } from "../lib/user-id";
import {
  CreateRitualBody,
  UpdateRitualBody,
  UpdateRitualParams,
  DeleteRitualParams,
  CreateRitualCompletionBody,
  DeleteRitualCompletionParams,
  ListRitualCompletionsQueryParams,
} from "@workspace/api-zod";

const router = Router();

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

// GET /api/rituals
router.get("/rituals", async (req, res) => {
  const userId = resolveUserId(req);
  const rows = await db
    .select()
    .from(ritualsTable)
    .where(eq(ritualsTable.userId, userId))
    .orderBy(ritualsTable.createdAt);
  res.json(rows.map(toRitualResponse));
});

// POST /api/rituals
router.post("/rituals", async (req, res) => {
  const userId = resolveUserId(req);
  const body = CreateRitualBody.parse(req.body);
  const [created] = await db
    .insert(ritualsTable)
    .values({ userId, label: body.label })
    .returning();
  res.status(201).json(toRitualResponse(created));
});

// PATCH /api/rituals/:id
router.patch("/rituals/:id", async (req, res) => {
  const userId = resolveUserId(req);
  const { id } = UpdateRitualParams.parse({ id: parseInt(req.params.id, 10) });
  const body = UpdateRitualBody.parse(req.body);
  const updateData: Partial<typeof ritualsTable.$inferInsert> = {};
  if (body.label !== undefined) updateData.label = body.label;

  const [updated] = await db
    .update(ritualsTable)
    .set(updateData)
    .where(and(eq(ritualsTable.id, id), eq(ritualsTable.userId, userId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Ritual not found" });
  res.json(toRitualResponse(updated));
});

// DELETE /api/rituals/:id
router.delete("/rituals/:id", async (req, res) => {
  const userId = resolveUserId(req);
  const { id } = DeleteRitualParams.parse({ id: parseInt(req.params.id, 10) });
  const [deleted] = await db
    .delete(ritualsTable)
    .where(and(eq(ritualsTable.id, id), eq(ritualsTable.userId, userId)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "Ritual not found" });
  res.status(204).end();
});

// GET /api/ritual-completions
router.get("/ritual-completions", async (req, res) => {
  const query = ListRitualCompletionsQueryParams.safeParse(req.query);
  const date = (query.success && query.data.date) ? query.data.date : new Date().toISOString().slice(0, 10);
  const rows = await db.select().from(ritualCompletionsTable).where(eq(ritualCompletionsTable.completedDate, date));
  res.json(rows.map(toCompletionResponse));
});

// POST /api/ritual-completions
router.post("/ritual-completions", async (req, res) => {
  const body = CreateRitualCompletionBody.parse(req.body);
  const completedDate = body.completedDate ?? new Date().toISOString().slice(0, 10);
  const [created] = await db
    .insert(ritualCompletionsTable)
    .values({ ritualId: body.ritualId, completedDate })
    .returning();
  res.status(201).json(toCompletionResponse(created));
});

// DELETE /api/ritual-completions/:id
router.delete("/ritual-completions/:id", async (req, res) => {
  const { id } = DeleteRitualCompletionParams.parse({ id: parseInt(req.params.id, 10) });
  const [deleted] = await db.delete(ritualCompletionsTable).where(eq(ritualCompletionsTable.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Completion not found" });
  res.status(204).end();
});

export default router;
