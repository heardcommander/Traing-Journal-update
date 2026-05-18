# Deploy Titan Journal (worldwide, low cost)

Production stack: **Cloudflare Pages** (frontend) + **Fly.io or Render** (API) + **Neon** (Postgres) + **Supabase** (auth) + **PayFast** or Stripe (payments).

## 0. Auth — Supabase

This app is a **Vite SPA**, not Next.js. Use `@supabase/supabase-js` only (no `@supabase/ssr`).

1. Create a project at [supabase.com](https://supabase.com).
2. Enable **Email** auth under Authentication → Providers.
3. Copy **Project URL** and **anon / publishable** key into `.env`:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...   # or sb_publishable_...
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

4. Set the same vars on your API host (Fly/Render) and Cloudflare Pages (`VITE_*` only on the frontend build).
5. After your first sign-up, copy your user UUID from Supabase → Authentication → Users if you want demo seed data: `SEED_USER_ID=... pnpm run db:seed`.

**Multi-user migration:** If Neon already has pre-auth demo rows, add `user_id` columns with `db:push` only after clearing or backfilling old rows.

## 1. Database — Neon (free tier)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string (`postgresql://...`).
3. Run migrations from your machine:

```bash
export DATABASE_URL="postgresql://..."
pnpm run db:push
pnpm run db:seed   # optional demo data
```

Use `postgresql://` in production — not `pglite://`.

## 2. API — Railway (recommended long-term)

Your Express API lives in `artifacts/api-server`. This repo includes `railway.toml` for deploy.

### What to deploy on Railway

| Railway resource | Needed for Titan Journal? |
|------------------|---------------------------|
| **Your GitHub repo** (API service) | **Yes** — this is the app |
| **Postgres** | **Optional** — you already use **Neon**; keep Neon or switch to Railway Postgres |
| **Redis** | **No** (not used yet) |
| **Bucket** | **No** (not used yet — future: CSV backups, chart images) |

### Steps

1. Push this repo to **GitHub** (if not already).
2. Railway → **New** → **GitHub Repo** → select `Trade-Journal-Upgrade`.
3. Railway detects `railway.toml` — one service for the API.
4. **Variables** (service → Variables):

```env
PORT=8080
DATABASE_URL=postgresql://...   # Neon URL OR Railway Postgres DATABASE_URL
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
APP_URL=https://YOUR-PROJECT.pages.dev
API_PUBLIC_URL=https://YOUR-API.up.railway.app
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...
PAYFAST_SANDBOX=true
```

5. **Deploy** → copy public URL → set `API_PUBLIC_URL` and PayFast ITN to  
   `https://YOUR-API.up.railway.app/api/billing/payfast/notify`
6. Run schema once from your machine (Neon or Railway DB):

```bash
DATABASE_URL="postgresql://..." pnpm run db:push
```

7. **Frontend** stays on **Cloudflare Pages** with `VITE_SUPABASE_*` set at build time. Point API calls to Railway:

```env
VITE_API_BASE=https://YOUR-API.up.railway.app
```

(Or proxy `/api` from Cloudflare to Railway — see below.)

### Using Railway Postgres instead of Neon

If you deployed Railway Postgres, use its **`DATABASE_URL`** in the API service (not `Postgres.railway.internal` from your laptop — use the **public** URL Railway shows, or reference `${{Postgres.DATABASE_URL}}` if linked in the same project).

You do **not** need Railway Redis or Bucket unless you add features later.

---

## 2b. API — Fly.io

```bash
# Install flyctl, then from repo root:
fly launch --no-deploy
fly secrets set DATABASE_URL="postgresql://..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  STRIPE_PRICE_ID="price_..." \
  APP_URL="https://your-app.pages.dev"
fly deploy
```

Set `PORT=8080` in `fly.toml`. Health check: `GET /api/healthz`.

**Render alternative:** Web Service, build `pnpm --filter @workspace/api-server run build`, start `node artifacts/api-server/dist/index.mjs`.

## 3. Frontend — Cloudflare Pages

1. Build:

```bash
export VITE_API_URL=""   # use relative /api if proxied, or full API URL
pnpm --filter @workspace/titan-journal run build
```

2. Connect GitHub repo in Cloudflare Pages.
3. Build command: `pnpm install && pnpm --filter @workspace/titan-journal run build`
4. Output directory: `artifacts/titan-journal/dist/public`
5. Add **redirect** for SPA: `/* /index.html 200`

### API proxy on Cloudflare

In Pages → Functions or use `_redirects` / worker to proxy `/api/*` → your Fly API URL so the browser stays same-origin.

Or set frontend env `VITE_API_BASE=https://api.yourdomain.com` and enable CORS on the API (already enabled).

## 4. Stripe

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Products → create **Pro** subscription price.
2. Copy `price_...` → `STRIPE_PRICE_ID`.
3. Developers → Webhooks → endpoint: `https://api.yourdomain.com/api/billing/webhook`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy signing secret → `STRIPE_WEBHOOK_SECRET`.

Local webhook testing:

```bash
stripe listen --forward-to localhost:8080/api/billing/webhook
```

## 5. Optional — OpenAI (Pro GPT coach)

```
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

Only Pro users (`plan=pro` in DB) use GPT; Free uses rule-based insights.

## 6. Custom domain

- Cloudflare Pages: add `journal.yourdomain.com`
- Fly: `fly certs add journal-api.yourdomain.com`
- Update `APP_URL` to your Pages URL for Stripe redirects.

## Cost estimate (starter)

| Service | Free tier |
|---------|-----------|
| Neon | 0.5 GB, plenty for early users |
| Cloudflare Pages | Unlimited static |
| Fly.io | Small VM free allowance |
| Stripe | Pay per transaction only |

## Environment checklist

```env
DATABASE_URL=postgresql://...
PORT=8080
APP_URL=https://your-frontend.pages.dev
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
AI_INTEGRATIONS_OPENAI_API_KEY=   # optional
AI_INTEGRATIONS_OPENAI_BASE_URL=  # optional
```
