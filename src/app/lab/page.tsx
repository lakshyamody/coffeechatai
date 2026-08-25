import Link from "next/link";
import { Avatar, Eyebrow, Logo } from "@/components/brand";
import { RoundControls } from "@/components/app/rerun-button";
import { Button } from "@/components/ui/button";
import { allProfiles, currentRound, getRoundNumber } from "@/lib/store";
import { WEIGHTS } from "@/lib/scoring";
import { popcount } from "@/lib/availability";
import { cityByName } from "@/lib/cities";
import { adminTokenConfigured, isOperator } from "@/lib/admin";
import { OperatorLocked } from "@/components/app/operator-locked";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matching lab | Brewed" };

const STRATEGY_COPY: Record<string, { title: string; body: string }> = {
  "stable-roommates": {
    title: "Solved with Irving's algorithm",
    body:
      "A stable matching exists for this round, so we used it. Stable means no two people in the round would both rather have had each other than the partner they got — nobody has an incentive to defect.",
  },
  "greedy-max-weight": {
    title: "No stable matching existed — maximised quality instead",
    body:
      "Unlike stable marriage, a stable roommates instance often has no solution at all, and this round is one of them. So we fell back to maximising total pair quality: greedy by score, then a repair pass to seat anyone stranded, then 2-opt swaps to claw back what greedy left on the table.",
  },
};

export default async function LabPage({ searchParams }: PageProps<"/lab">) {
  const params = await searchParams;
  const token = typeof params?.key === "string" ? params.key : undefined;
  // The lab lists every member by name alongside who they were paired with.
  if (!(await isOperator(token))) {
    return <OperatorLocked what="matching lab" configured={adminTokenConfigured()} />;
  }

  const round = await currentRound();
  const roundNumber = await getRoundNumber();
  const profiles = await allProfiles();
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const strategy = STRATEGY_COPY[round.strategy];

  const stats = [
    { label: "People in the pool", value: round.stats.poolSize.toLocaleString() },
    { label: "Viable pairs scored", value: round.stats.candidateEdges.toLocaleString() },
    { label: "Chats arranged", value: round.pairings.length.toLocaleString() },
    { label: "Held over", value: round.unmatched.length.toLocaleString() },
    { label: "Average pair score", value: round.stats.averageScore.toFixed(1) },
    { label: "Blocking pairs", value: round.stats.blockingPairs.toLocaleString() },
    { label: "Solve time", value: `${round.stats.elapsedMs}ms` },
    {
      label: "Density",
      value: `${Math.round(
        (100 * round.stats.candidateEdges) /
          Math.max(1, (round.stats.poolSize * (round.stats.poolSize - 1)) / 2),
      )}%`,
    },
  ];

  return (
    <main className="paper-grain min-h-screen pb-20">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" className="font-semibold text-bark hover:bg-sand">
            <Link href="/outbox">Outbox</Link>
          </Button>
          <Button asChild variant="ghost" className="font-semibold text-bark hover:bg-sand">
            <Link href="/dashboard">Your match</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5">
        <div className="mt-10 text-center">
          <Eyebrow>Matching lab · round {roundNumber}</Eyebrow>
          <h1 className="mt-2 font-display text-5xl leading-none text-ink sm:text-6xl">
            How this round was solved
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-bark">
            The whole round, in the open. Re-run it to watch the arrangement
            move, or close it to record these chats — once recorded, a pair can
            never come up again.
          </p>
          <div className="mt-6">
            <RoundControls />
          </div>
        </div>

        {/* strategy */}
        <div className="sticker-lg mt-10 rounded-2xl bg-espresso p-6 text-paper">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-primary">
            strategy = {round.strategy}
          </p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-paper">
            {strategy.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-clay">
            {strategy.body}
          </p>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="sticker rounded-xl p-4">
              <p className="font-display text-3xl leading-none text-roast">{s.value}</p>
              <p className="mt-1.5 text-xs font-semibold leading-snug text-olive">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* weights */}
        <div className="sticker mt-6 rounded-xl p-5">
          <h3 className="font-display text-2xl tracking-wide text-ink">
            What the score is made of
          </h3>
          <div className="mt-3 flex h-8 overflow-hidden rounded-lg border-2 border-ink">
            {(
              [
                ["reciprocity", "var(--color-roast)", "text-white"],
                ["resonance", "var(--color-crema)", "text-ink"],
                ["complementarity", "var(--color-matcha)", "text-white"],
                ["logistics", "var(--color-sky)", "text-white"],
                ["serendipity", "var(--color-olive)", "text-white"],
              ] as const
            ).map(([key, color, fg]) => (
              <div
                key={key}
                className={`grid place-items-center text-[0.6rem] font-bold uppercase tracking-wider ${fg}`}
                style={{ width: `${WEIGHTS[key] * 100}%`, background: color }}
                title={`${key}: ${Math.round(WEIGHTS[key] * 100)}%`}
              >
                {Math.round(WEIGHTS[key] * 100)}%
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-olive">
            Reciprocity · Resonance · Complementarity · Logistics · Serendipity
          </p>
        </div>

        {/* pairings */}
        <h2 className="mt-12 font-display text-4xl leading-none text-ink">
          Every pairing
        </h2>
        <div className="mt-5 flex flex-col gap-2.5">
          {round.pairings.map((p) => {
            const a = byId.get(p.a);
            const b = byId.get(p.b);
            if (!a || !b) return null;
            return (
              <div
                key={`${p.a}-${p.b}`}
                className="sticker flex flex-wrap items-center gap-3 rounded-xl p-3.5"
              >
                <span className="font-display text-2xl tabular-nums text-roast">
                  {Math.round(p.score.total)}
                </span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={a.name} seed={a.avatarSeed} className="h-8 w-8 text-[0.65rem]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">
                        {a.name}
                      </span>
                      <span className="block truncate text-[0.7rem] text-olive">
                        {a.headline}
                      </span>
                    </span>
                  </span>
                  <span className="font-script text-xl text-roast">&amp;</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={b.name} seed={b.avatarSeed} className="h-8 w-8 text-[0.65rem]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">
                        {b.name}
                      </span>
                      <span className="block truncate text-[0.7rem] text-olive">
                        {b.headline}
                      </span>
                    </span>
                  </span>
                </div>
                <span className="ml-auto hidden max-w-xs text-right text-[0.7rem] leading-snug text-olive lg:block">
                  {p.reasons[0]?.detail}
                </span>
              </div>
            );
          })}
        </div>

        {/* held over */}
        {round.unmatched.length > 0 && (
          <>
            <h2 className="mt-12 font-display text-4xl leading-none text-ink">
              Held over
            </h2>
            <p className="mt-1 text-sm text-bark">
              Nobody gets a bad match to pad the numbers. These people wait a
              round.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {round.unmatched.map((id) => {
                const p = byId.get(id);
                if (!p) return null;
                const blocks = popcount(p.availability);
                const weight = cityByName(p.city)?.weight ?? 0;
                const why =
                  p.format === "in-person" && weight < 5
                    ? `In-person only in ${p.city}, which is quiet this week.`
                    : blocks < 6
                      ? `Only ${blocks} free block${blocks === 1 ? "" : "s"} marked.`
                      : "Odd pool — fewest viable partners, so held over.";
                return (
                  <div key={id} className="sticker flex items-center gap-3 rounded-xl p-3.5">
                    <Avatar name={p.name} seed={p.avatarSeed} className="h-9 w-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                      <p className="truncate text-[0.7rem] text-olive">{p.headline}</p>
                    </div>
                    <p className="max-w-xs text-right text-[0.7rem] leading-snug text-berry">
                      {why}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
