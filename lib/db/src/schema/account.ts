import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const accountTable = pgTable("account", {
  userId: text("user_id").primaryKey(),
  email: text("email"),
  plan: text("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Account = typeof accountTable.$inferSelect;
