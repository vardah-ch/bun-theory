import { NextResponse } from "next/server";
import { z } from "zod";
import { addSubscriber } from "@/lib/server/subscribers";

const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "That doesn't look like an email address." }, { status: 422 });
  }
  const { already } = await addSubscriber(parsed.data.email);
  return NextResponse.json({ ok: true, already });
}
