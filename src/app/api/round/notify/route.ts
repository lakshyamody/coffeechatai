import { NextResponse } from "next/server";
import { allProfiles, currentRound, getProfile } from "@/lib/store";
import { explain } from "@/lib/scoring";
import { slotLabel } from "@/lib/availability";
import { matchEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * The Wednesday 7pm send.
 *
 * Both halves of every pairing get their own email, each written from their
 * own side, each carrying the other person's address so they can set the
 * chat up directly without the product sitting in the middle.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const round = await currentRound();
  const byId = new Map((await allProfiles()).map((p) => [p.id, p]));

  let sent = 0;
  const failures: string[] = [];

  for (const pairing of round.pairings) {
    const a = byId.get(pairing.a);
    const b = byId.get(pairing.b);
    if (!a || !b) continue;

    for (const [me, them] of [
      [a, b],
      [b, a],
    ] as const) {
      const inPerson =
        me.city === them.city && me.format !== "virtual" && them.format !== "virtual";
      const record = await sendEmail({
        to: me.email,
        ...matchEmail({
          name: me.name,
          matchName: them.name,
          matchHeadline: them.headline,
          matchEmail: them.email,
          matchCity: them.city,
          score: pairing.score.total,
          reasons: explain(me, them, pairing.score).map((r) => ({
            label: r.label,
            detail: r.detail,
          })),
          slot: pairing.slot !== null ? slotLabel(pairing.slot) : null,
          inPerson,
          dashboardUrl: `${origin}/dashboard`,
        }),
      });
      if (record.error) failures.push(`${me.email}: ${record.error}`);
      else sent++;
    }
  }

  const unmatched = (
    await Promise.all(round.unmatched.map((id) => getProfile(id)))
  )
    .map((p) => p?.email)
    .filter((e): e is string => Boolean(e));

  return NextResponse.json({
    sent,
    pairings: round.pairings.length,
    skippedUnmatched: unmatched.length,
    failures,
  });
}
