import Link from "next/link";
import { CoffeeCup, Logo } from "@/components/brand";
import { MatchReveal, type RevealPerson } from "@/components/app/match-reveal";
import { OptInButton } from "@/components/app/opt-in-button";
import { Button } from "@/components/ui/button";
import { currentRound, getProfile, getRoundNumber, profileCount } from "@/lib/store";
import { currentProfile } from "@/lib/session";
import { closesAt, roundPhase, sendsAt, zoneAbbreviation } from "@/lib/schedule";
import { Countdown } from "@/components/site/countdown";
import { pairingFor } from "@/lib/matching";
import { explain, starters } from "@/lib/scoring";
import { popcount } from "@/lib/availability";
import { cityByName } from "@/lib/cities";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your match | Brewed" };

const toReveal = (p: Profile): RevealPerson => ({
  id: p.id,
  name: p.name,
  email: p.email,
  summary: p.structured?.summary,
  headline: p.headline,
  city: p.city,
  avatarSeed: p.avatarSeed,
  availability: p.availability,
  format: p.format,
});

function Shell({ children }: { children: React.ReactNode }) {
  const phase = roundPhase();
  return (
    <main className="paper-grain min-h-screen">
      <div className="border-b-2 border-ink bg-primary/25 px-5 py-2 text-center">
        <Countdown
          className="text-xs font-semibold text-bark"
          deadlineIso={phase.deadline.toISOString()}
          label={phase.label}
          zone={zoneAbbreviation()}
          fallback={phase.phase === "open" ? closesAt : sendsAt}
        />
      </div>
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-8">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" className="font-semibold text-bark hover:bg-sand">
            <Link href="/outbox">Outbox</Link>
          </Button>
          <Button asChild variant="ghost" className="font-semibold text-bark hover:bg-sand">
            <Link href="/lab">Matching lab</Link>
          </Button>
        </div>
      </div>
      {children}
    </main>
  );
}

export default async function DashboardPage() {
  const roundNumber = await getRoundNumber();
  const me = await currentProfile();

  // --- Not signed in ---
  if (!me) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-5 py-16 text-center">
          <CoffeeCup className="mx-auto h-16 w-16" />
          <h1 className="mt-5 font-display text-5xl leading-none text-ink">
            You&apos;re not in a round yet
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-bark">
            Sign in with your email, paste your LinkedIn, and answer one question.
            You&apos;ll be in the next round we solve.
          </p>
          <Button
            asChild
            className="sticker sticker-press mt-7 h-12 rounded-xl bg-primary px-7 font-display text-xl tracking-wide text-ink hover:bg-primary"
          >
            <Link href="/login">Join round {roundNumber}</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  // --- Opted out ---
  if (!me.optedIn) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="font-display text-5xl leading-none text-ink">
            You&apos;re sitting this one out
          </h1>
          <p className="mt-3 text-base leading-relaxed text-bark">
            No streak to break. Opt back in and you&apos;ll be in the next round
            we solve.
          </p>
          <div className="mt-7">
            <OptInButton />
          </div>
        </div>
      </Shell>
    );
  }

  const round = await currentRound();
  const pairing = pairingFor(round, me.id);

  // --- Enrolled but unmatched: say why, honestly ---
  if (!pairing) {
    const blocks = popcount(me.availability);
    const cityWeight = cityByName(me.city)?.weight ?? 0;
    const poolSize = await profileCount();
    const hardNoes = me.structured?.dealBreakers.length ?? 0;
    const causes: string[] = [];

    if (poolSize <= 1) {
      causes.push(
        "You're the first person here. There is literally nobody to pair you with yet — send this to someone you'd actually want to talk to.",
      );
    } else if (poolSize < 6) {
      causes.push(
        `There are ${poolSize} people in the pool. That's not enough for the matcher to find anyone worth your time, so it held you over rather than inventing a match.`,
      );
    } else {
      if (me.format === "in-person" && cityWeight < 5) {
        causes.push(
          `You're in-person only, so we can only look at people in ${me.city}. There aren't enough of them yet.`,
        );
      }
      if (blocks < 6) {
        causes.push(
          `You marked ${blocks} free block${blocks === 1 ? "" : "s"}. Every extra block widens who you can actually meet.`,
        );
      }
      if (hardNoes >= 3) {
        causes.push(
          `You have ${hardNoes} hard noes set. Those delete people from your pool outright, and together they may be cutting too deep.`,
        );
      }
      if (!causes.length) {
        causes.push(
          "The round had an odd number of people and you had the fewest viable partners, so you were held over rather than given a bad match.",
        );
      }
    }

    return (
      <Shell>
        <div className="mx-auto max-w-xl px-5 py-14">
          <div className="text-center">
            <CoffeeCup className="mx-auto h-14 w-14 opacity-60" />
            <h1 className="mt-5 font-display text-5xl leading-none text-ink">
              {poolSize <= 1 ? "Nobody here yet" : "No match this round"}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-bark">
              We&apos;d rather tell you than invent someone.
            </p>
          </div>
          <div className="mt-7 flex flex-col gap-2.5">
            {causes.map((c) => (
              <p key={c} className="sticker rounded-xl p-4 text-sm leading-relaxed text-bark">
                {c}
              </p>
            ))}
          </div>
          <div className="mt-7 text-center">
            <Button
              asChild
              className="sticker sticker-press h-12 rounded-xl bg-primary px-7 font-display text-xl tracking-wide text-ink hover:bg-primary"
            >
              <Link href="/join">Widen my answers</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  const otherId = pairing.a === me.id ? pairing.b : pairing.a;
  const them = await getProfile(otherId);
  if (!them) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="font-display text-4xl text-ink">That match went stale</h1>
          <p className="mt-3 text-bark">Refresh to re-solve the round.</p>
        </div>
      </Shell>
    );
  }

  // Reasons are written from `pairing.a`'s point of view; flip if that's not me.
  // `pairing.reasons` is written neutrally for the lab; the person actually
  // reading their match gets it in the second person, from their own side.
  const oriented = {
    reasons: explain(me, them, pairing.score),
    starters: starters(me, them),
  };

  return (
    <Shell>
      <MatchReveal
        me={toReveal(me)}
        them={toReveal(them)}
        score={pairing.score}
        reasons={oriented.reasons}
        starters={oriented.starters}
        slot={pairing.slot}
        roundNumber={roundNumber}
      />
    </Shell>
  );
}
