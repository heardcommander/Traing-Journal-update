import { Router, type Request } from "express";
import Stripe from "stripe";
import { getAccount, updateAccount } from "../lib/account";
import type { AuthedRequest } from "../middleware/auth";
import {
  buildPayfastPaymentFields,
  isPayfastPaymentComplete,
  payfastConfigured,
  payfastProcessUrl,
  verifyPayfastItn,
} from "../lib/payfast";

const router = Router();

function uid(req: Request) {
  return (req as AuthedRequest).userId;
}

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:18405";
}

function proAmountZar(): string {
  return process.env.PAYFAST_AMOUNT_ZAR ?? "149.00";
}

router.get("/billing/status", async (req, res) => {
  const account = await getAccount(uid(req), (req as AuthedRequest).userEmail);
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);

  res.json({
    plan: account.plan,
    email: account.email,
    currentPeriodEnd: account.currentPeriodEnd?.toISOString() ?? null,
    stripeConfigured,
    payfastConfigured: payfastConfigured(),
    proPriceZar: proAmountZar(),
    currency: "ZAR",
    region: "ZA",
    paymentMethods: {
      payfast: payfastConfigured(),
      stripe: stripeConfigured,
      manualEft: true,
    },
    features: {
      csvImport: true,
      ruleBasedAi: true,
      gptCoach: account.plan === "pro",
      unlimitedTrades: account.plan === "pro",
    },
  });
});

/** PayFast — recommended for South Africa (cards, EFT, SnapScan, etc.) */
router.post("/billing/payfast/checkout", async (req, res) => {
  if (!payfastConfigured()) {
    return res.status(503).json({
      error: "PayFast is not configured. Set PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE in .env",
    });
  }

  const user = uid(req);
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : undefined;
  const account = await getAccount(user, email);
  if (email) await updateAccount(user, { email });

  const paymentId = `tj-pro-${user}-${Date.now()}`;
  const apiBase = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;

  const fields = buildPayfastPaymentFields({
    paymentId,
    amountZar: proAmountZar(),
    itemName: "Titan Journal Pro (1 month)",
    userId: user,
    email: email ?? account.email ?? undefined,
    returnUrl: `${appUrl()}/billing?success=1`,
    cancelUrl: `${appUrl()}/billing?canceled=1`,
    notifyUrl: `${apiBase}/api/billing/payfast/notify`,
  });

  res.json({
    action: payfastProcessUrl(),
    method: "POST",
    fields,
  });
});

export async function handlePayfastNotify(body: Record<string, string>): Promise<void> {
  if (!verifyPayfastItn(body)) {
    throw new Error("Invalid PayFast signature");
  }
  if (!isPayfastPaymentComplete(body)) return;

  const userId = body.custom_str1;
  if (!userId) throw new Error("Missing user id on PayFast ITN");

  const email = body.email_address;
  if (email) await updateAccount(userId, { email });

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await updateAccount(userId, {
    plan: "pro",
    currentPeriodEnd: periodEnd,
  });
}

/** Stripe — optional (not available in most of South Africa) */
router.post("/billing/checkout", async (req, res) => {
  const stripe = stripeClient();
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!stripe || !priceId) {
    return res.status(503).json({
      error: "Stripe is not configured. Use PayFast for South Africa (POST /api/billing/payfast/checkout).",
    });
  }

  const user = uid(req);
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : undefined;
  const account = await getAccount(user, email);
  if (email) await updateAccount(user, { email });

  let customerId = account.stripeCustomerId ?? undefined;
  if (!customerId && email) {
    const customer = await stripe.customers.create({ email });
    customerId = customer.id;
    await updateAccount(user, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/billing?success=1`,
    cancel_url: `${appUrl()}/billing?canceled=1`,
    metadata: { userId: user },
    subscription_data: { metadata: { userId: user } },
  });

  res.json({ url: session.url });
});

router.post("/billing/portal", async (req, res) => {
  const stripe = stripeClient();
  if (!stripe) {
    return res.status(503).json({ error: "Stripe is not configured" });
  }

  const account = await getAccount(uid(req));
  if (!account.stripeCustomerId) {
    return res.status(400).json({ error: "No Stripe billing account. Use PayFast in South Africa." });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${appUrl()}/billing`,
  });

  res.json({ url: session.url });
});

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string | undefined,
): Promise<{ status: number; body: unknown }> {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return { status: 503, body: { error: "Stripe webhook not configured" } };
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", secret);
  } catch {
    return { status: 400, body: { error: "Invalid signature" } };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer && typeof session.customer === "string") {
        const userId = session.metadata?.userId;
        if (userId) {
          await updateAccount(userId, {
            stripeCustomerId: session.customer,
            plan: "pro",
            stripeSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : null,
          });
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const active = sub.status === "active" || sub.status === "trialing";
      const userId = sub.metadata?.userId;
      if (userId) {
        await updateAccount(userId, {
          plan: active ? "pro" : "free",
          stripeSubscriptionId: sub.id,
          stripeCustomerId: typeof sub.customer === "string" ? sub.customer : undefined,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const userId = (event.data.object as Stripe.Subscription).metadata?.userId;
      if (userId) {
        await updateAccount(userId, { plan: "free", stripeSubscriptionId: null, currentPeriodEnd: null });
      }
      break;
    }
    default:
      break;
  }

  return { status: 200, body: { received: true } };
}

export default router;
