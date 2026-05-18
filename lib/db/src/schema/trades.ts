import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradeTypeEnum = pgEnum("trade_type", ["Buy", "Sell"]);

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  pair: text("pair").notNull(),
  type: tradeTypeEnum("type").notNull(),
  pnl: numeric("pnl", { precision: 12, scale: 2 }).notNull(),
  emotion: text("emotion").notNull(),
  setup: text("setup").notNull(),
  notes: text("notes"),
  lessonsLearned: text("lessons_learned"),
  marketSession: text("market_session"),
  stopLoss: numeric("stop_loss", { precision: 12, scale: 5 }),
  takeProfit: numeric("take_profit", { precision: 12, scale: 5 }),
  confidence: integer("confidence"),
  rating: integer("rating"),
  tags: text("tags"),
  tradedAt: timestamp("traded_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
