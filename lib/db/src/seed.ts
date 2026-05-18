import "dotenv/config";
import { eq } from "drizzle-orm";
import { closeDatabase, db } from "./index";
import { tradesTable, ritualsTable } from "./schema";

async function seed() {
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.log("Set SEED_USER_ID to your Supabase user UUID to seed demo data for that account.");
    await closeDatabase();
    return;
  }

  const existing = await db.select().from(tradesTable).where(eq(tradesTable.userId, userId)).limit(1);
  if (existing.length > 0) {
    console.log("Database already has trades for this user — skipping seed.");
    await closeDatabase();
    return;
  }

  const rituals = await db
    .insert(ritualsTable)
    .values([
      { userId, label: "Review economic calendar" },
      { userId, label: "Define max risk per trade" },
      { userId, label: "Pre-market journal entry" },
      { userId, label: "No trading first 15 minutes" },
    ])
    .returning();

  console.log(`Seeded ${rituals.length} rituals`);

  const now = Date.now();
  const samples = [
    { pair: "EUR/USD", type: "Buy" as const, pnl: "125.50", emotion: "Confident", setup: "Breakout", stopLoss: "1.0850", takeProfit: "1.0920", confidence: 8, rating: 4 },
    { pair: "GBP/USD", type: "Sell" as const, pnl: "-45.00", emotion: "Anxious", setup: "Reversal", stopLoss: "1.2720", confidence: 5, rating: 2 },
    { pair: "XAU/USD", type: "Buy" as const, pnl: "210.00", emotion: "Calm", setup: "Trend Follow", stopLoss: "2320.00", takeProfit: "2355.00", confidence: 9, rating: 5 },
    { pair: "USD/JPY", type: "Sell" as const, pnl: "78.25", emotion: "Focused", setup: "Breakout", stopLoss: "151.20", confidence: 7, rating: 4 },
    { pair: "NAS100", type: "Buy" as const, pnl: "-120.00", emotion: "FOMO", setup: "Scalp", confidence: 4, rating: 1 },
    { pair: "EUR/USD", type: "Sell" as const, pnl: "55.00", emotion: "Calm", setup: "Range", stopLoss: "1.0900", takeProfit: "1.0860", confidence: 7, rating: 4 },
    { pair: "BTC/USD", type: "Buy" as const, pnl: "340.00", emotion: "Confident", setup: "Trend Follow", stopLoss: "62000", takeProfit: "65000", confidence: 8, rating: 5 },
    { pair: "GBP/USD", type: "Buy" as const, pnl: "-30.00", emotion: "Impatient", setup: "Scalp", confidence: 5, rating: 2 },
  ];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!;
    await db.insert(tradesTable).values({
      ...s,
      userId,
      notes: "Demo trade for client preview.",
      lessonsLearned: i % 2 === 0 ? "Waited for confirmation — good discipline." : "Entered early — need more patience.",
      marketSession: i % 3 === 0 ? "London" : i % 3 === 1 ? "New York" : "Asia",
      tradedAt: new Date(now - i * 86400000 * 1.5),
    });
  }

  console.log(`Seeded ${samples.length} demo trades`);
  await closeDatabase();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
