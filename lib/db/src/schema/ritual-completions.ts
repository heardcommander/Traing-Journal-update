import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ritualsTable } from "./rituals";

export const ritualCompletionsTable = pgTable("ritual_completions", {
  id: serial("id").primaryKey(),
  ritualId: integer("ritual_id").notNull().references(() => ritualsTable.id, { onDelete: "cascade" }),
  completedDate: text("completed_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRitualCompletionSchema = createInsertSchema(ritualCompletionsTable).omit({ id: true, createdAt: true });
export type InsertRitualCompletion = z.infer<typeof insertRitualCompletionSchema>;
export type RitualCompletion = typeof ritualCompletionsTable.$inferSelect;
