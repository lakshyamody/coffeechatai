import { NextResponse } from "next/server";
import { getProfile, invalidateRound, upsertProfile } from "@/lib/store";
import { requireProfileId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const id = await requireProfileId();
  if (!id) return NextResponse.json({ error: "Not enrolled." }, { status: 401 });

  const profile = await getProfile(id);
  if (!profile) return NextResponse.json({ error: "No such member." }, { status: 404 });

  let body: { optedIn?: boolean; block?: string };
  try {
    body = (await request.json()) as { optedIn?: boolean; block?: string };
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const next = { ...profile };
  if (typeof body.optedIn === "boolean") next.optedIn = body.optedIn;
  if (typeof body.block === "string" && body.block !== id) {
    next.blocked = [...new Set([...next.blocked, body.block])];
  }

  await upsertProfile(next);
  invalidateRound();
  return NextResponse.json({ ok: true, optedIn: next.optedIn });
}
