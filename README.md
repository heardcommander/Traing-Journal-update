# Titan Journal

Personal trading journal — track trades, psychology, daily rituals, and AI coaching.

## Quick start (local)

**Requirements:** Node.js **20.19+** or **22+** (project includes `.tools/node` if your system Node is older), [pnpm](https://pnpm.io) 9.x

```bash
# Use bundled Node 22 if needed (macOS arm64)
export PATH="$(pwd)/.tools/node/bin:$PATH"

# 1. Install dependencies
npx pnpm@9.15.0 install

# 2. Environment (default uses embedded Postgres — no Docker)
cp .env.example .env

# 3. Apply schema + demo data
npx pnpm@9.15.0 run db:push
npx pnpm@9.15.0 run db:seed

# 4. Run API (terminal 1)
npx pnpm@9.15.0 run dev:api

# 5. Run frontend (terminal 2)
npx pnpm@9.15.0 run dev:web
```

Open **http://localhost:18405**

## New in this release

- **Import** — `/import` upload CSV trade history (template included)
- **Billing** — `/billing` PayFast (ZA) + optional Stripe (see [DEPLOY-SA.md](./DEPLOY-SA.md))
- **Deploy guide** — worldwide hosting with Neon + Cloudflare + Fly

## Features

- **Dashboard** — P&L stats, equity curve, recent trades, daily rituals
- **Trade log** — Search, filter, delete with confirmation
- **Analytics** — Equity curve, heatmap, setup/emotion breakdowns
- **Rituals** — Daily habit checklist
- **AI Coach** — Pattern analysis (OpenAI optional; works offline with rule-based insights)

## Optional: live AI

Add to `.env`:

```
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

## Replit

See `replit.md` for Replit-specific workflow commands.
