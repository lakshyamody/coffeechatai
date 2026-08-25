import { NextResponse } from "next/server";
import { commitRound, currentRound } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const { roundNumber, recorded } = await commitRound();
  const next = await currentRound();
  return NextResponse.json({
    roundNumber,
    recorded,
    strategy: next.strategy,
    pairings: next.pairings.length,
    unmatched: next.unmatched.length,
  });
}
