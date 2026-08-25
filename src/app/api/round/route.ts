import { NextResponse } from "next/server";
import { allProfiles, currentRound, invalidateRound } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const round = await currentRound();
  const byId = new Map((await allProfiles()).map((p) => [p.id, p]));
  return NextResponse.json({
    strategy: round.strategy,
    stats: round.stats,
    unmatched: round.unmatched.length,
    pairings: round.pairings.slice(0, 12).map((p) => ({
      a: byId.get(p.a)?.name ?? p.a,
      b: byId.get(p.b)?.name ?? p.b,
      score: Math.round(p.score.total),
    })),
  });
}

export async function POST() {
  invalidateRound();
  const round = await currentRound();
  return NextResponse.json({ strategy: round.strategy, stats: round.stats });
}
