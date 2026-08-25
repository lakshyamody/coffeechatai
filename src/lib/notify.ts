import type { RoundResult } from "./types";
import { allProfiles, getProfile } from "./store";
import { explain } from "./scoring";
import { slotLabel } from "./availability";
import { matchEmail, sendEmail } from "./email";

/**
 * Send both halves of every pairing their own email.
 *
 * Shared by the scheduled tick and the manual button in the lab, so a
 * hand-triggered send is byte-identical to the automatic one.
 */
export async function sendRoundEmails(
  round: RoundResult,
  origin: string,
): Promise<{ sent: number; failures: string[]; skippedUnmatched: number }> {
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
  ).filter(Boolean).length;

  return { sent, failures, skippedUnmatched: unmatched };
}
