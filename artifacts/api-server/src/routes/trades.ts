import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import {
  CreateTradeBody,
  UpdateTradeBody,
  UpdateTradeParams,
  GetTradeParams,
  DeleteTradeParams,
  ListTradesQueryParams,
} from "@workspace/api-zod";
import { z } from "zod";
import { parseTradesCsv } from "../lib/csv-trades";
import type { AuthedRequest } from "../middleware/auth";

const ImportTradesBody = z.object({ csv: z.string().min(1) });

const router = Router();

function userId(req: Request) {
  return (req as AuthedRequest).userId;
}

function toTradeResponse(t: typeof tradesTable.$inferSelect) {
  return {
    ...t,
    pnl: parseFloat(String(t.pnl)),
    stopLoss: t.stopLoss != null ? parseFloat(String(t.stopLoss)) : null,
    takeProfit: t.takeProfit != null ? parseFloat(String(t.takeProfit)) : null,
    tradedAt: t.tradedAt instanceof Date ? t.tradedAt.toISOString() : t.tradedAt,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  };
}

router.get("/trades/pnl-history", async (req, res) => {
  const uid = userId(req);
  const trades = await db
    .select({ tradedAt: tradesTable.tradedAt, pnl: tradesTable.pnl })
    .from(tradesTable)
    .where(eq(tradesTable.userId, uid))
    .orderBy(tradesTable.tradedAt);

  const byDate: Record<string, { dailyPnl: number; tradeCount: number }> = {};
  for (const t of trades) {
    const date = new Date(t.tradedAt).toISOString().slice(0, 10);
    if (!byDate[date]) byDate[date] = { dailyPnl: 0, tradeCount: 0 };
    byDate[date].dailyPnl += parseFloat(String(t.pnl));
    byDate[date].tradeCount++;
  }

  let cumulative = 0;
  const history = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { dailyPnl, tradeCount }]) => {
      cumulative += dailyPnl;
      return {
        date,
        dailyPnl: parseFloat(dailyPnl.toFixed(2)),
        cumulativePnl: parseFloat(cumulative.toFixed(2)),
        tradeCount,
      };
    });

  res.json(history);
});

router.get("/trades/stats", async (req, res) => {
  const uid = userId(req);
  const trades = await db
    .select()
    .from(tradesTable)
    .where(eq(tradesTable.userId, uid))
    .orderBy(desc(tradesTable.tradedAt));

  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return res.json({
      totalPnl: 0,
      winRate: 0,
      bestSetup: null,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      riskDisciplineScore: 0,
      setupBreakdown: [],
      emotionBreakdown: [],
    });
  }

  const wins = trades.filter((t) => parseFloat(String(t.pnl)) > 0).length;
  const losses = trades.filter((t) => parseFloat(String(t.pnl)) < 0).length;
  const totalPnl = trades.reduce((s, t) => s + parseFloat(String(t.pnl)), 0);
  const winRate = (wins / totalTrades) * 100;

  const setupMap: Record<string, { count: number; totalPnl: number; wins: number }> = {};
  for (const t of trades) {
    if (!setupMap[t.setup]) setupMap[t.setup] = { count: 0, totalPnl: 0, wins: 0 };
    const pnl = parseFloat(String(t.pnl));
    setupMap[t.setup].count++;
    setupMap[t.setup].totalPnl += pnl;
    if (pnl > 0) setupMap[t.setup].wins++;
  }

  const setupBreakdown = Object.entries(setupMap).map(([setup, data]) => ({
    setup,
    count: data.count,
    totalPnl: parseFloat(data.totalPnl.toFixed(2)),
    winRate: parseFloat(((data.wins / data.count) * 100).toFixed(1)),
  }));

  const bestSetup = setupBreakdown.sort((a, b) => b.totalPnl - a.totalPnl)[0]?.setup ?? null;

  const emotionMap: Record<string, { count: number; totalPnl: number }> = {};
  for (const t of trades) {
    if (!emotionMap[t.emotion]) emotionMap[t.emotion] = { count: 0, totalPnl: 0 };
    emotionMap[t.emotion].count++;
    emotionMap[t.emotion].totalPnl += parseFloat(String(t.pnl));
  }
  const emotionBreakdown = Object.entries(emotionMap).map(([emotion, data]) => ({
    emotion,
    count: data.count,
    totalPnl: parseFloat(data.totalPnl.toFixed(2)),
  }));

  const withSL = trades.filter((t) => t.stopLoss != null).length;

  return res.json({
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(1)),
    bestSetup,
    totalTrades,
    wins,
    losses,
    riskDisciplineScore: parseFloat(((withSL / totalTrades) * 100).toFixed(1)),
    setupBreakdown,
    emotionBreakdown,
  });
});

router.post("/trades/import", async (req, res) => {
  const uid = userId(req);
  const body = ImportTradesBody.parse(req.body);
  const { rows, errors } = parseTradesCsv(body.csv);

  if (rows.length === 0) {
    return res.status(400).json({
      imported: 0,
      skipped: 0,
      errors: errors.length ? errors : ["No valid rows found"],
    });
  }

  let imported = 0;
  for (const row of rows) {
    await db.insert(tradesTable).values({
      userId: uid,
      pair: row.pair,
      type: row.type,
      pnl: String(row.pnl),
      emotion: row.emotion,
      setup: row.setup,
      notes: row.notes,
      lessonsLearned: row.lessonsLearned,
      marketSession: row.marketSession,
      stopLoss: row.stopLoss != null ? String(row.stopLoss) : null,
      takeProfit: row.takeProfit != null ? String(row.takeProfit) : null,
      confidence: row.confidence,
      rating: row.rating,
      tags: row.tags,
      tradedAt: row.tradedAt ?? new Date(),
    });
    imported++;
  }

  res.json({ imported, skipped: errors.length, errors });
});

router.get("/trades", async (req, res) => {
  const uid = userId(req);
  const query = ListTradesQueryParams.safeParse(req.query);
  const { search, setup, emotion } = query.success ? query.data : {};

  let rows = await db
    .select()
    .from(tradesTable)
    .where(eq(tradesTable.userId, uid))
    .orderBy(desc(tradesTable.tradedAt));

  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (t) =>
        t.pair.toLowerCase().includes(s) ||
        t.setup.toLowerCase().includes(s) ||
        (t.notes ?? "").toLowerCase().includes(s),
    );
  }
  if (setup) rows = rows.filter((t) => t.setup === setup);
  if (emotion) rows = rows.filter((t) => t.emotion === emotion);

  res.json(rows.map(toTradeResponse));
});

router.post("/trades", async (req, res) => {
  const uid = userId(req);
  const body = CreateTradeBody.parse(req.body);
  const [created] = await db
    .insert(tradesTable)
    .values({
      userId: uid,
      pair: body.pair,
      type: body.type as "Buy" | "Sell",
      pnl: String(body.pnl),
      emotion: body.emotion,
      setup: body.setup,
      notes: body.notes,
      lessonsLearned: body.lessonsLearned,
      marketSession: body.marketSession,
      stopLoss: body.stopLoss != null ? String(body.stopLoss) : null,
      takeProfit: body.takeProfit != null ? String(body.takeProfit) : null,
      confidence: body.confidence,
      rating: body.rating,
      tags: body.tags,
      tradedAt: body.tradedAt ? new Date(body.tradedAt) : new Date(),
    })
    .returning();
  res.status(201).json(toTradeResponse(created));
});

router.get("/trades/:id", async (req, res) => {
  const uid = userId(req);
  const { id } = GetTradeParams.parse({ id: parseInt(req.params.id, 10) });
  const [trade] = await db
    .select()
    .from(tradesTable)
    .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, uid)));
  if (!trade) return res.status(404).json({ error: "Trade not found" });
  res.json(toTradeResponse(trade));
});

router.patch("/trades/:id", async (req, res) => {
  const uid = userId(req);
  const { id } = UpdateTradeParams.parse({ id: parseInt(req.params.id, 10) });
  const body = UpdateTradeBody.parse(req.body);

  const updateData: Partial<typeof tradesTable.$inferInsert> = {};
  if (body.pair !== undefined) updateData.pair = body.pair;
  if (body.type !== undefined) updateData.type = body.type as "Buy" | "Sell";
  if (body.pnl !== undefined) updateData.pnl = String(body.pnl);
  if (body.emotion !== undefined) updateData.emotion = body.emotion;
  if (body.setup !== undefined) updateData.setup = body.setup;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.lessonsLearned !== undefined) updateData.lessonsLearned = body.lessonsLearned;
  if (body.marketSession !== undefined) updateData.marketSession = body.marketSession;
  if (body.stopLoss !== undefined) updateData.stopLoss = body.stopLoss != null ? String(body.stopLoss) : null;
  if (body.takeProfit !== undefined) updateData.takeProfit = body.takeProfit != null ? String(body.takeProfit) : null;
  if (body.confidence !== undefined) updateData.confidence = body.confidence;
  if (body.rating !== undefined) updateData.rating = body.rating;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.tradedAt !== undefined) updateData.tradedAt = new Date(body.tradedAt);

  const [updated] = await db
    .update(tradesTable)
    .set(updateData)
    .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, uid)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Trade not found" });
  res.json(toTradeResponse(updated));
});

router.delete("/trades/:id", async (req, res) => {
  const uid = userId(req);
  const { id } = DeleteTradeParams.parse({ id: parseInt(req.params.id, 10) });
  const [deleted] = await db
    .delete(tradesTable)
    .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, uid)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "Trade not found" });
  res.status(204).end();
});

export default router;
