import { pool } from "./pool";

/**
 * Ensures Neon/Postgres tables match the app schema on API startup.
 * Safe to run repeatedly (CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 */
export async function ensureSchema(): Promise<void> {
  if (!pool) return;

  const client = await pool.connect();
  try {
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE trade_type AS ENUM ('Buy', 'Sell');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS rituals (
        id serial PRIMARY KEY,
        user_id text NOT NULL,
        label text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS trades (
        id serial PRIMARY KEY,
        user_id text NOT NULL,
        pair text NOT NULL,
        type trade_type NOT NULL,
        pnl numeric(12, 2) NOT NULL,
        emotion text NOT NULL,
        setup text NOT NULL,
        notes text,
        lessons_learned text,
        market_session text,
        stop_loss numeric(12, 5),
        take_profit numeric(12, 5),
        confidence integer,
        rating integer,
        tags text,
        traded_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ritual_completions (
        id serial PRIMARY KEY,
        ritual_id integer NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
        completed_date text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE rituals ADD COLUMN IF NOT EXISTS user_id text;
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id text;
      ALTER TABLE rituals ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS lessons_learned text;
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_session text;
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss numeric(12, 5);
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit numeric(12, 5);
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS confidence integer;
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS rating integer;
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS tags text;
    `);
  } finally {
    client.release();
  }
}
