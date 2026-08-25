import { NextResponse } from "next/server";
import { activeRound } from "@/lib/store";
import { sendRoundEmails } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Manual trigger for the same send the scheduler performs. */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const round = await activeRound();
  const result = await sendRoundEmails(round, origin);
  return NextResponse.json({ ...result, pairings: round.pairings.length });
}
