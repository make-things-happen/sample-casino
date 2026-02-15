import { NextResponse } from "next/server";
import { registrationSchema } from "~/lib/validation";
import { sendRegistration } from "~/lib/womo";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const res = await sendRegistration(parsed.data);

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
