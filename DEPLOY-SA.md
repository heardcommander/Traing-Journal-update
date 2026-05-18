# South Africa deployment & payments

Stripe is **not available** for most South African businesses. Use **PayFast** (recommended) or **Paystack**.

## Payment options in South Africa

| Provider | Best for | Notes |
|----------|----------|--------|
| **PayFast** | Local ZAR, cards, EFT, SnapScan | [payfast.co.za](https://www.payfast.co.za) — most common |
| **Paystack** | Modern API, ZAR | [paystack.com](https://paystack.com) — works in ZA |
| **Manual EFT** | MVP / first customers | You confirm payment, set `plan = pro` in DB |
| Stripe | Usually ❌ in SA | Keep code optional if you expand abroad |

## PayFast setup (already wired in Titan Journal)

### 1. Create a PayFast account
- Sign up at [payfast.co.za](https://www.payfast.co.za)
- Complete merchant verification (required for live payments)
- Use **Sandbox** for testing: [sandbox.payfast.co.za](https://sandbox.payfast.co.za)

### 2. Add to `.env`

```env
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_SANDBOX=true
PAYFAST_AMOUNT_ZAR=149.00

# Public URL PayFast calls back (must be HTTPS in production)
API_PUBLIC_URL=https://your-api.fly.dev
APP_URL=https://your-app.pages.dev
```

Sandbox credentials above are PayFast’s public test values.

### 3. ITN (webhook) URL

In PayFast dashboard → Settings → **Instant Transaction Notification**:

```
https://YOUR-API-DOMAIN/api/billing/payfast/notify
```

Must be **HTTPS** and publicly reachable (use ngrok locally: `ngrok http 8080`).

### 4. Test checkout
1. Restart API with new `.env`
2. Open `/billing` → **Pay with PayFast**
3. Use sandbox card details from PayFast docs
4. After payment, ITN upgrades account to **Pro** for 30 days

## Hosting from South Africa

Same as [DEPLOY.md](./DEPLOY.md):

- **Neon** — Postgres (you already use this)
- **Fly.io** or **Render** — API (works globally)
- **Cloudflare Pages** — frontend (fast in ZA)

No need for US-only services for payments.

## Free tier strategy (no gateway yet)

1. Ship **Free** with full journal + rule-based AI (no cost to you)
2. Accept **manual EFT** for Pro (instructions on `/billing`)
3. Add PayFast when ready for automation

## Paystack (alternative)

If you prefer Paystack over PayFast, their API is Stripe-like. We can add a Paystack route next — say the word.

## Tax & compliance (brief)

- Register for VAT if turnover requires it (SARS)
- PayFast issues payment records; keep invoices for subscribers
- Add Privacy Policy / POPIA notice before going live
