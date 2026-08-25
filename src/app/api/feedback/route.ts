import { NextResponse } from "next/server";
import { currentRound, getProfile, invalidateRound, upsertProfile } from "@/lib/store";
import { pairingFor } from "@/lib/matching";
import { updatePreferences, preferenceHighlights } from "@/lib/preferences";
import { requireProfileId } from "@/lib/session";
import type { BehavioralSignal } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Close the loop: a rating is a labelled example of a pairing this member
 * liked or didn't, and we already know exactly why the matcher made it.
 */
export async function POST(request: Request) {
  const id = await requireProfileId();
  if (!id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const me = await getProfile(id);
  if (!me) return NextResponse.json({ error: "No such member." }, { status: 404 });

  let body: { rating?: number; tags?: string[]; met?: boolean };
  try {
    body = (await request.json()) as { rating?: number; tags?: string[]; met?: boolean };
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rate the chat from 1 to 5." }, { status: 422 });
  }
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string").slice(0, 6)
    : [];

  const pairing = pairingFor(await currentRound(), me.id);
  if (!pairing) {
    return NextResponse.json({ error: "No match to rate this round." }, { status: 404 });
  }
  const otherId = pairing.a === me.id ? pairing.b : pairing.a;

  const signals: BehavioralSignal[] = [
    ...me.signals,
    {
      kind: body.met === false ? "no-show" : "chat-completed",
      pairedWith: otherId,
      at: new Date().toISOString(),
    },
    {
      kind: "rated",
      pairedWith: otherId,
      rating,
      tags,
      breakdown: pairing.score,
      at: new Date().toISOString(),
    },
  ];

  const preferences = updatePreferences(me.preferences, pairing.score, rating, tags);
  const updated = { ...me, signals, preferences };
  await upsertProfile(updated);
  invalidateRound();

  return NextResponse.json({
    ok: true,
    observations: preferences.observations,
    weights: preferences.weights,
    highlights: preferenceHighlights(updated),
  });
}
