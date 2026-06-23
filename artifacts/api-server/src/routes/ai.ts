import { Router } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { resolveUserId } from "../lib/user-id";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/ai/analyze", async (req, res) => {
  const userId = resolveUserId(req);
  const trades = await db
    .select()
    .from(tradesTable)
    .where(eq(tradesTable.userId, userId))
    .orderBy(desc(tradesTable.tradedAt))
    .limit(50);

  if (trades.length === 0) {
    return res.json({
      patterns: ["No trades recorded yet — start journaling to unlock pattern analysis."],
      strengths: ["Ready to track your first trade"],
      improvements: ["Add your first trade to begin building your edge"],
      psychologyInsight: "Your trading journal is empty. The act of journaling trades is itself a discipline edge — most traders never do it.",
      tipOfTheDay: "The best trade you can make today is journaling the one you already took.",
      generatedAt: new Date().toISOString(),
    });
  }

  const totalTrades = trades.length;
  const wins = trades.filter((t) => parseFloat(String(t.pnl)) > 0).length;
  const losses = trades.filter((t) => parseFloat(String(t.pnl)) < 0).length;
  const totalPnl = trades.reduce((s, t) => s + parseFloat(String(t.pnl)), 0);
  const winRate = ((wins / totalTrades) * 100).toFixed(1);

  const emotionMap: Record<string, { count: number; pnl: number }> = {};
  const setupMap: Record<string, { count: number; pnl: number; wins: number }> = {};

  for (const t of trades) {
    const pnl = parseFloat(String(t.pnl));
    emotionMap[t.emotion] ??= { count: 0, pnl: 0 };
    emotionMap[t.emotion].count++;
    emotionMap[t.emotion].pnl += pnl;
    setupMap[t.setup] ??= { count: 0, pnl: 0, wins: 0 };
    setupMap[t.setup].count++;
    setupMap[t.setup].pnl += pnl;
    if (pnl > 0) setupMap[t.setup].wins++;
  }

  const statsPayload = {
    totalTrades,
    wins,
    losses,
    winRate: `${winRate}%`,
    totalPnl: totalPnl.toFixed(2),
    recentTrades: trades.slice(0, 10).map((t) => ({
      pair: t.pair,
      type: t.type,
      pnl: parseFloat(String(t.pnl)),
      emotion: t.emotion,
      setup: t.setup,
      confidence: t.confidence,
      rating: t.rating,
      notes: t.notes,
      lessonsLearned: t.lessonsLearned,
    })),
    emotionBreakdown: Object.entries(emotionMap).map(([emotion, d]) => ({
      emotion,
      count: d.count,
      avgPnl: (d.pnl / d.count).toFixed(2),
    })),
    setupBreakdown: Object.entries(setupMap).map(([setup, d]) => ({
      setup,
      count: d.count,
      winRate: `${((d.wins / d.count) * 100).toFixed(1)}%`,
      totalPnl: d.pnl.toFixed(2),
    })),
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an elite trading performance coach and psychologist. Analyze the trader's journal data and return a JSON object with exactly these fields:
- patterns: string[] (3-5 specific behavioral or performance patterns you observe)
- strengths: string[] (2-3 genuine strengths evident from the data)
- improvements: string[] (2-3 specific, actionable improvements)
- psychologyInsight: string (1-2 sentences on the trader's psychological patterns)
- tipOfTheDay: string (one powerful, specific tip tailored to this trader's data)

Be direct, specific, and honest. Reference actual data points (specific setups, emotions, win rates). Avoid generic advice. Return only valid JSON.`,
      },
      {
        role: "user",
        content: `Analyze my trading journal:\n${JSON.stringify(statsPayload, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 800,
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as {
    patterns?: string[];
    strengths?: string[];
    improvements?: string[];
    psychologyInsight?: string;
    tipOfTheDay?: string;
  };

  res.json({
    patterns: parsed.patterns ?? [],
    strengths: parsed.strengths ?? [],
    improvements: parsed.improvements ?? [],
    psychologyInsight: parsed.psychologyInsight ?? "",
    tipOfTheDay: parsed.tipOfTheDay ?? "",
    generatedAt: new Date().toISOString(),
  });
});

export default router;
