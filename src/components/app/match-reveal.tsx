"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarCheck,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquareQuote,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, Eyebrow } from "@/components/brand";
import { FeedbackCard } from "@/components/app/feedback-card";
import { Button } from "@/components/ui/button";
import { bookingHostLabel } from "@/lib/booking";
import { WEIGHTS } from "@/lib/scoring";
import type { MatchReason, ScoreBreakdown } from "@/lib/types";
import { ROUND_LABELS } from "@/lib/schedule";

export interface RevealPerson {
  id: string;
  name: string;
  email: string;
  headline: string;
  city: string;
  avatarSeed: number;
  calendlyUrl: string | null;
  format: string;
  /** One-line read from the structured profile, when it exists. */
  summary?: string;
}

const TERMS: Array<{ key: keyof typeof WEIGHTS; label: string; color: string; blurb: string }> = [
  { key: "reciprocity", label: "Reciprocity", color: "var(--color-roast)", blurb: "You each have what the other asked for" },
  { key: "resonance", label: "Resonance", color: "var(--color-crema)", blurb: "Shared context, weighted so rare interests count more" },
  { key: "complementarity", label: "Complementarity", color: "var(--color-matcha)", blurb: "Seniority gap, talker/listener balance, same kind of chat" },
  { key: "logistics", label: "Logistics", color: "var(--color-sky)", blurb: "Overlapping calendars, timezones, and format" },
  { key: "serendipity", label: "Serendipity", color: "var(--color-olive)", blurb: "Different enough that you'll learn something" },
];

export function MatchReveal({
  me,
  them,
  score,
  reasons,
  starters,
  booking,
  roundNumber,
}: {
  me: RevealPerson;
  them: RevealPerson;
  score: ScoreBreakdown;
  reasons: MatchReason[];
  starters: string[];
  booking: { a: string | null; b: string | null };
  roundNumber: number;
}) {
  const router = useRouter();
  const theirBooking = them.calendlyUrl ?? booking.b ?? null;
  const myBooking = me.calendlyUrl ?? booking.a ?? null;
  const [busy, setBusy] = useState(false);

  const inPerson =
    me.city === them.city && me.format !== "virtual" && them.format !== "virtual";

  const skipWeek = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optedIn: false }),
      });
      if (!res.ok) throw new Error();
      toast.success("Sitting out this round. Opt back in any time.");
      router.refresh();
    } catch {
      toast.error("Couldn't update. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="text-center">
        <Eyebrow>Round {roundNumber} · {ROUND_LABELS.sendsDay} {ROUND_LABELS.sendsTimeLong}</Eyebrow>
        <h1 className="mt-2 font-display text-5xl leading-none text-ink sm:text-6xl">
          Your coffee chat
        </h1>
      </div>

      {/* the poster */}
      <div className="sticker-lg mt-8 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-center gap-5 border-b-2 border-ink bg-primary/30 px-6 py-7">
          <div className="text-center">
            <Avatar name={me.name} seed={me.avatarSeed} className="mx-auto h-16 w-16 text-xl" />
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-olive">You</p>
          </div>
          <div className="text-center">
            <p className="font-script text-4xl leading-none text-roast">&amp;</p>
          </div>
          <div className="text-center">
            <Avatar name={them.name} seed={them.avatarSeed} className="mx-auto h-16 w-16 text-xl" />
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-olive">Them</p>
          </div>
        </div>

        <div className="px-6 py-6 text-center">
          <h2 className="font-display text-4xl leading-none text-ink">{them.name}</h2>
          <p className="mt-1.5 text-sm font-semibold text-bark">{them.headline}</p>
          {them.summary && (
            <p className="mx-auto mt-2 max-w-sm text-sm italic leading-relaxed text-olive">
              {them.summary}
            </p>
          )}
          <p className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-olive">
            {inPerson ? <MapPin className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
            {inPerson ? `Café in ${them.city}` : `Video · they're in ${them.city}`}
          </p>

          <div className="mt-5 flex justify-center">
            <div className="inline-flex items-baseline gap-2 rounded-full border-2 border-ink bg-cream px-4 py-1.5">
              <span className="font-display text-3xl leading-none text-roast">
                {Math.round(score.total)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-olive">
                pair score
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* connect — the whole point: hand over the address and get out of the way */}
      <section className="mt-6">
        <div className="sticker rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-olive">
            Reach them directly
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a
              href={`mailto:${them.email}`}
              className="font-display text-xl tracking-wide text-roast underline decoration-2 underline-offset-4"
            >
              {them.email}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(them.email);
                toast.success("Email copied.");
              }}
              className="rounded-md border border-white/25 bg-white/10 p-1.5 transition-transform hover:translate-y-px"
              aria-label="Copy email address"
            >
              <Copy className="h-3.5 w-3.5 text-bark" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-bark">
            {them.name.split(" ")[0]} got the same email with your address. Either
            of you can write first — we&apos;re not in the middle of it.
          </p>
          <Button
            asChild
            className="sticker sticker-press mt-4 h-11 rounded-lg bg-primary px-5 font-display text-lg tracking-wide text-primary-foreground hover:bg-primary"
          >
            <a
              href={`mailto:${them.email}?subject=${encodeURIComponent(
                "Coffee chat this week?",
              )}&body=${encodeURIComponent(
                `Hi ${them.name.split(" ")[0]} — Brewed matched us this week.\n\n`,
              )}`}
            >
              <Mail className="mr-1.5 h-4 w-4" />
              Email {them.name.split(" ")[0]}
            </a>
          </Button>
        </div>
      </section>

      {/* why */}
      <section className="mt-8">
        <h3 className="font-display text-3xl leading-none text-ink">Why you two</h3>
        <div className="mt-4 flex flex-col gap-2.5">
          {reasons.map((r) => (
            <div key={r.label} className="sticker rounded-xl p-4">
              <p className="font-display text-lg leading-tight tracking-wide text-ink">
                {r.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-bark">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* score breakdown */}
      <section className="mt-8">
        <h3 className="font-display text-3xl leading-none text-ink">The numbers</h3>
        <p className="mt-1 text-sm text-bark">
          Every term, and how much of the final score it&apos;s worth.
        </p>
        <div className="sticker mt-4 flex flex-col gap-4 rounded-xl p-5">
          {TERMS.map((t) => {
            const value = score[t.key];
            return (
              <div key={t.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-ink">
                    {t.label}
                    <span className="ml-2 font-mono text-[0.65rem] font-normal uppercase tracking-wider text-olive">
                      {Math.round(WEIGHTS[t.key] * 100)}% of score
                    </span>
                  </p>
                  <span className="font-display text-xl tabular-nums text-roast">
                    {Math.round(value * 100)}
                  </span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${value * 100}%`, background: t.color }}
                  />
                </div>
                <p className="mt-1 text-xs leading-snug text-olive">{t.blurb}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* scheduling — through their own booking link, not a calendar we keep */}
      <section className="mt-8">
        <h3 className="font-display text-3xl leading-none text-ink">Pick a time</h3>
        <p className="mt-1 text-sm text-bark">
          {theirBooking
            ? `${them.name.split(" ")[0]} takes bookings — grab a slot that suits you.`
            : `${them.name.split(" ")[0]} hasn't added a booking link, so agree a time by email.`}
        </p>
        <div className="sticker mt-4 rounded-xl p-5">
          {theirBooking ? (
            <>
              <Button
                asChild
                className="sticker sticker-press h-12 w-full rounded-lg bg-primary font-display text-xl tracking-wide text-primary-foreground hover:bg-primary"
              >
                <a href={theirBooking} target="_blank" rel="noopener noreferrer">
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Book with {them.name.split(" ")[0]}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <p className="mt-2 text-center text-xs text-olive">
                {bookingHostLabel(theirBooking)}
              </p>
            </>
          ) : (
            <Button
              asChild
              className="sticker sticker-press h-12 w-full rounded-lg bg-primary font-display text-xl tracking-wide text-primary-foreground hover:bg-primary"
            >
              <a href={`mailto:${them.email}?subject=${encodeURIComponent("Coffee chat this week?")}`}>
                <Mail className="mr-2 h-5 w-5" />
                Suggest a time by email
              </a>
            </Button>
          )}

          <p className="mt-4 border-t-2 border-dashed border-sand pt-3 text-xs leading-relaxed text-olive">
            {myBooking ? (
              <>
                They can book you back at{" "}
                <span className="font-semibold text-bark">
                  {bookingHostLabel(myBooking)}
                </span>
                .
              </>
            ) : (
              <>
                You haven&apos;t added a booking link.{" "}
                <Link href="/join" className="font-semibold text-roast underline">
                  Add one
                </Link>{" "}
                and people can book you in a click instead of trading emails.
              </>
            )}
          </p>
        </div>
      </section>

      {/* starters */}
      <section className="mt-8">
        <h3 className="font-display text-3xl leading-none text-ink">
          Four things worth asking
        </h3>
        <div className="sticker mt-4 flex flex-col gap-3 rounded-xl p-5">
          {starters.map((s) => (
            <p key={s} className="flex gap-2.5 text-sm leading-relaxed text-bark">
              <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-roast" />
              {s}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <FeedbackCard matchName={them.name} />
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-sand pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={skipWeek}
          disabled={busy}
          className="font-semibold text-olive hover:bg-sand"
        >
          Sit out this round
        </Button>
        <Button
          asChild
          variant="ghost"
          className="font-semibold text-olive hover:bg-sand"
        >
          <Link href="/lab">See how the round was solved →</Link>
        </Button>
      </div>
    </div>
  );
}
