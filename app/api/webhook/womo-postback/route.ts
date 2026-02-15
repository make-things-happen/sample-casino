import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

const WOMO_WEBHOOK_SECRET = process.env.WOMO_WEBHOOK_SECRET;

function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  if (signature.length !== expected.length) return false;

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return result === 0;
}

export async function POST(req: Request) {
  if (!WOMO_WEBHOOK_SECRET) {
    console.error("[WEBHOOK] WOMO_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-signature");
  const rawBody = await req.text();

  if (!signature) {
    console.error("[WEBHOOK] No signature provided");
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 401 },
    );
  }

  const isValid = verifySignature(rawBody, signature, WOMO_WEBHOOK_SECRET);
  if (!isValid) {
    console.error("[WEBHOOK] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(rawBody);
  console.log("[WEBHOOK] Received valid postback:", data);
  return NextResponse.json({ received: true, data });
}
