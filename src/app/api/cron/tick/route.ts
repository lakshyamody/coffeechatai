import { NextResponse } from "next/server";
import {
  activeRound,
  bootstrapSchedule,
  commitRound,
  freezeRound,
  markSent,
  roundStatus,
} from "@/lib/store";
import { sendRoundEmails } from "@/lib/notify";
import { mostRecentCloseAt, mostRecentSendAt, roundPhase, TIME_ZONE } from "@/lib/schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * The scheduler.
 *
 * Idempotent by design: it works out what *should* have happened by now and
 * does only the parts that haven't. That means the cron cadence doesn't have
 * to line up exactly with the deadlines, a missed run self-heals on the next
 * one, and running it twice does nothing the second time — which matters a
 * lot when the side effect is emailing everybody.
 */
export async function GET(request: Request) {
  // Vercel Cron sends this header. Without a secret configured we still
  // require the request to look like it came from the platform.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron");
  if (secret ? auth !== `Bearer ${secret}` : !isVercelCron) {
    return NextResponse.json({ error: "not authorised" }, { status: 401 });
  }

  const now = new Date();
  const origin = new URL(request.url).origin;
  const did: string[] = [];

  // First run on a fresh database: record where we are and stop. Acting on
  // deadlines that passed before this deployment existed would mean emailing
  // the whole pool on an arbitrary day.
  if (await bootstrapSchedule(now)) {
    const phase = roundPhase(now);
    return NextResponse.json({
      ranAt: now.toISOString(),
      timeZone: TIME_ZONE,
      did: ["initialised the schedule; no round acted on"],
      phase: phase.phase,
      nextDeadline: phase.deadline.toISOString(),
    });
  }

  let status = await roundStatus(now);

  // 1. Entries closed since we last looked — solve and freeze the pairings.
  if (status.closeDue) {
    const round = await freezeRound(now);
    did.push(`froze round ${status.number}: ${round.pairings.length} pairs, ${round.unmatched.length} held over`);
    status = await roundStatus(now);
  }

  // 2. Send time has passed — email everyone, then advance.
  let emailed: Awaited<ReturnType<typeof sendRoundEmails>> | null = null;
  if (status.sendDue && status.frozen) {
    const round = await activeRound();
    emailed = await sendRoundEmails(round, origin);
    await markSent(now);
    const advanced = await commitRound();
    did.push(
      `round ${status.number}: ${emailed.sent} emails delivered` +
        (emailed.failures.length ? `, ${emailed.failures.length} FAILED` : "") +
        `; recorded ${advanced.recorded} chats; opened round ${advanced.roundNumber}`,
    );
  } else if (status.sendDue && !status.frozen) {
    // Send time reached with nothing frozen — the close tick never ran.
    // Freezing now is better than skipping the week entirely.
    const round = await freezeRound(now);
    emailed = await sendRoundEmails(round, origin);
    await markSent(now);
    const advanced = await commitRound();
    did.push(
      `recovered: froze and sent round ${status.number} late — ${emailed.sent} delivered` +
        (emailed.failures.length ? `, ${emailed.failures.length} FAILED` : "") +
        `; opened round ${advanced.roundNumber}`,
    );
  }

  if (emailed && emailed.sent === 0 && emailed.failures.length > 0) {
    console.error(
      `[cron] every match email failed (${emailed.failures.length}). First: ${emailed.failures[0]}`,
    );
  }

  const phase = roundPhase(now);
  return NextResponse.json({
    ranAt: now.toISOString(),
    timeZone: TIME_ZONE,
    did: did.length ? did : ["nothing due"],
    phase: phase.phase,
    nextDeadline: phase.deadline.toISOString(),
    lastCloseWindow: mostRecentCloseAt(now).toISOString(),
    lastSendWindow: mostRecentSendAt(now).toISOString(),
    failures: emailed?.failures ?? [],
  });
}
