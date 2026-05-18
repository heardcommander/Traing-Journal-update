# Titan Journal

A personal trading journal app for serious retail traders — track trades, understand psychology, and build a measurable edge over time.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/titan-journal run dev` — run the frontend (port 18405)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI via Replit AI proxy

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui + Recharts + Framer Motion
- Fonts: Space Grotesk (UI), JetBrains Mono (numbers/P&L)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema: `trades.ts`, `rituals.ts`, `ritual-completions.ts`
- `artifacts/api-server/src/routes/` — Express routes: `trades.ts`, `rituals.ts`, `ai.ts`
- `artifacts/titan-journal/src/pages/` — frontend pages
- `artifacts/titan-journal/src/index.css` — dark theme CSS vars
- `lib/integrations-openai-ai-server/` — OpenAI client via Replit AI proxy

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks and Zod validators
- `/trades/stats` and `/trades/pnl-history` registered before `/trades/:id` to avoid Express 5 path conflicts
- `pnl`, `stopLoss`, `takeProfit` stored as `numeric` in Postgres; always coerce with `parseFloat(String(val))` before returning
- Dark mode applied on mount by adding `.dark` to `document.documentElement`
- AI analysis uses `gpt-4o-mini` with JSON response format; gracefully returns stub data when no trades exist

## Product

- **Dashboard** — P&L summary, equity curve chart, recent trades, today's ritual checklist
- **Trade Log** — searchable/filterable table of all trades with inline delete
- **Add Trade** — full form with pair, direction, P&L, setup, emotion, risk management, self-assessment, journal notes
- **Trade Detail** — full trade view with inline editing of notes, lessons, rating, tags
- **Analytics** — equity curve, setup P&L breakdown, emotion P&L breakdown, performance table
- **Daily Rituals** — add/remove/edit habit checklist; mark completions per day with progress bar
- **AI Coach** — one-click analysis of trading patterns, strengths, improvements, psychology insights

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Restart the API server workflow after any route/schema changes (server needs a full rebuild)
- `pnl` from DB is a string from Drizzle; always `parseFloat(String(t.pnl))` in route handlers

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
