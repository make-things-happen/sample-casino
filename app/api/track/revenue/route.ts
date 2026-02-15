import { revenueSchema } from "~/lib/validation";
import { sendRevenue } from "~/lib/womo";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = revenueSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid revenue data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const res = await sendRevenue(parsed.data);

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
