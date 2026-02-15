import { reversalSchema } from "~/lib/validation";
import { sendReversal } from "~/lib/womo";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
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
