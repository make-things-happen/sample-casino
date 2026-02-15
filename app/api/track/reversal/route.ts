import { NextResponse } from "next/server";
import { reversalSchema } from "~/lib/validation";
import { sendReversal } from "~/lib/womo";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reversalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid reversal data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const res = await sendReversal(parsed.data.txId);

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "WOMO API error", details: text },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
