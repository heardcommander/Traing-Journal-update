import crypto from "node:crypto";

const SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const LIVE_URL = "https://www.payfast.co.za/eng/process";

export function payfastConfigured(): boolean {
  return Boolean(
    process.env.PAYFAST_MERCHANT_ID &&
      process.env.PAYFAST_MERCHANT_KEY &&
      process.env.PAYFAST_PASSPHRASE,
  );
}

export function payfastProcessUrl(): string {
  return process.env.PAYFAST_SANDBOX === "true" ? SANDBOX_URL : LIVE_URL;
}

function encodeValue(val: string): string {
  return encodeURIComponent(String(val).trim()).replace(/%20/g, "+");
}

export function generatePayfastSignature(
  data: Record<string, string>,
  passphrase?: string,
): string {
  const keys = Object.keys(data)
    .filter((k) => k !== "signature" && data[k] !== "")
    .sort();
  const paramString = keys.map((k) => `${k}=${encodeValue(data[k]!)}`).join("&");
  const pass =
    passphrase != null && passphrase !== ""
      ? `&passphrase=${encodeURIComponent(passphrase.trim())}`
      : "";
  return crypto.createHash("md5").update(`${paramString}${pass}`).digest("hex");
}

export function buildPayfastPaymentFields(opts: {
  paymentId: string;
  amountZar: string;
  itemName: string;
  userId: string;
  email?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}): Record<string, string> {
  const merchant_id = process.env.PAYFAST_MERCHANT_ID!;
  const merchant_key = process.env.PAYFAST_MERCHANT_KEY!;

  const data: Record<string, string> = {
    merchant_id,
    merchant_key,
    return_url: opts.returnUrl,
    cancel_url: opts.cancelUrl,
    notify_url: opts.notifyUrl,
    m_payment_id: opts.paymentId,
    amount: opts.amountZar,
    item_name: opts.itemName,
  };

  if (opts.email) data.email_address = opts.email;
  data.custom_str1 = opts.userId;

  data.signature = generatePayfastSignature(data, process.env.PAYFAST_PASSPHRASE);
  return data;
}

export function verifyPayfastItn(body: Record<string, string>): boolean {
  const received = body.signature;
  if (!received) return false;
  const copy = { ...body };
  delete copy.signature;
  const expected = generatePayfastSignature(copy, process.env.PAYFAST_PASSPHRASE);
  return received === expected;
}

export function isPayfastPaymentComplete(body: Record<string, string>): boolean {
  return body.payment_status === "COMPLETE";
}
