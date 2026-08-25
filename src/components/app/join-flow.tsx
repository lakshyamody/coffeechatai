"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  KeyRound,
  BriefcaseBusiness,
  Loader2,
  PartyPopper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, Logo } from "@/components/brand";
import { AvailabilityGrid } from "@/components/app/availability-grid";
import { TagGrid } from "@/components/app/tag-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_AVAILABILITY } from "@/lib/availability";
import { tagLabel } from "@/lib/taxonomy";
import { DEAL_BREAKERS, type StructuredProfile } from "@/lib/types";
import { sendsAt } from "@/lib/schedule";

interface PreviewMatch {
  name: string;
  headline: string;
  city: string;
  avatarSeed: number;
  score: number;
}

interface Derived {
  headline: string;
  city: string;
  offers: string[];
  seeks: string[];
  topics: string[];
  direction: string;
}

const FORMAT_OPTIONS = [
  { id: "either", label: "Either works", detail: "Café if we're close, video if not." },
  { id: "virtual", label: "Video only", detail: "Match me anywhere in the world." },
  { id: "in-person", label: "In person only", detail: "Only people in my city." },
];

const DIRECTION_COPY: Record<string, string> = {
  senior: "people further along than you",
  peer: "people at your level",
  junior: "people earlier than you",
  any: "no strong preference on seniority",
};

export function JoinFlow({
  verifiedEmail,
  roundNumber,
}: {
  verifiedEmail: string;
  roundNumber: number;
}) {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [wantToMeet, setWantToMeet] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [city, setCity] = useState("");
  const [format, setFormat] = useState("either");
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    structured: StructuredProfile;
    derived: Derived;
    preview: PreviewMatch[];
    source: string;
  } | null>(null);

  const ready = wantToMeet.trim().length >= 10 && (linkedinText.trim().length >= 20 || linkedinUrl.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl,
          linkedinText,
          wantToMeet,
          city: city || undefined,
          format,
          availability,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
        return;
      }
      setResult({
        structured: data.structured,
        derived: data.derived,
        preview: data.preview ?? [],
        source: data.source,
      });
    } catch {
      toast.error("Couldn't reach the matcher. Try again.");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- result ---------------- */
  if (result) {
    const { structured, derived, preview, source } = result;
    return (
      <div className="mx-auto max-w-2xl px-5 py-14 text-center">
        <PartyPopper className="mx-auto h-14 w-14 text-roast" strokeWidth={1.8} />
        <h1 className="mt-5 font-display text-5xl leading-none text-ink">
          You&apos;re in round {roundNumber}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-bark">
          Check your inbox — we&apos;ve emailed you a confirmation. {sendsAt} you&apos;ll
          get one person, why the two of you, and their email.
        </p>

        <div className="sticker-lg mt-8 rounded-2xl p-5 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-roast" />
            <p className="text-xs font-bold uppercase tracking-wider text-olive">
              What we read from that
              {source === "heuristic" && " · rules-based fallback"}
            </p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink">{structured.summary}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Reads as">
              <p className="text-sm text-bark">{derived.headline}</p>
              <p className="text-sm text-bark">{derived.city}</p>
            </Field>
            <Field label="Wants to meet">
              <p className="text-sm text-bark">
                {DIRECTION_COPY[derived.direction] ?? derived.direction}
              </p>
            </Field>
            <TagList title="Can offer" ids={derived.offers} />
            <TagList title="Looking for" ids={derived.seeks} />
            <TagList title="Topics" ids={derived.topics} />
            <Field label="Values">
              <ul className="flex flex-col gap-0.5">
                {structured.values.slice(0, 4).map((v) => (
                  <li key={v} className="text-sm leading-snug text-bark">
                    &middot; {v}
                  </li>
                ))}
              </ul>
            </Field>
          </div>

          {structured.dealBreakers.length > 0 && (
            <div className="mt-4 border-t-2 border-dashed border-sand pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-olive">
                Enforced hard noes
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {structured.dealBreakers.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border-2 border-ink bg-berry px-2.5 py-0.5 text-xs font-semibold text-white"
                  >
                    {DEAL_BREAKERS.find((x) => x.id === d)?.label ?? d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-olive">
            Wrong about you? Rewrite your answer any time — we re-read you before
            every round.
          </p>
        </div>

        {preview.length > 0 && (
          <>
            <p className="mt-8 text-xs font-bold uppercase tracking-wider text-olive">
              Closest in the pool right now
            </p>
            <div className="mt-4 flex flex-col gap-3 text-left">
              {preview.map((m) => (
                <div key={m.name} className="sticker flex items-center gap-3 rounded-xl p-4">
                  <Avatar name={m.name} seed={m.avatarSeed} className="h-11 w-11 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-tight tracking-wide text-ink">
                      {m.name}
                    </p>
                    <p className="truncate text-xs font-semibold text-olive">
                      {m.headline} · {m.city}
                    </p>
                  </div>
                  <span className="font-display text-2xl text-roast">{m.score}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <SetPasswordCard />

        <Button
          asChild
          className="sticker sticker-press mt-6 h-12 rounded-xl bg-primary px-7 font-display text-xl tracking-wide text-ink hover:bg-primary"
        >
          <Link href="/dashboard">See your match →</Link>
        </Button>
      </div>
    );
  }

  /* ---------------- the form ---------------- */
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive">
          <ShieldCheck className="h-4 w-4 text-matcha" strokeWidth={2.5} />
          {verifiedEmail}
        </span>
      </div>

      <h1 className="mt-8 font-display text-5xl leading-none text-ink sm:text-6xl">
        Two things and you&apos;re in
      </h1>
      <p className="mt-3 text-base leading-relaxed text-bark">
        No questionnaire. We read your background and what you want, and work
        out the rest.
      </p>

      {/* LinkedIn */}
      <section className="sticker-lg mt-8 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-sky" />
          <h2 className="font-display text-2xl tracking-wide text-ink">
            Your LinkedIn
          </h2>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-olive">
            Profile URL
          </Label>
          <Input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="linkedin.com/in/yourname"
            className="sticker h-11 rounded-lg focus-visible:ring-0"
          />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-olive">
            Paste your headline, about, and recent roles
          </Label>
          <Textarea
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
            rows={7}
            maxLength={6000}
            placeholder={`Staff Engineer at Stripe · Bangalore

About: I work on payments reliability — mostly the ledger path and the things that go wrong at p99. Before Stripe I spent four years at a marketplace startup that didn't make it, which taught me more than the years that worked.

Experience: Staff Engineer, Stripe (2022–now) · Senior Engineer, Verdant (2018–2022)`}
            className="sticker rounded-lg text-sm focus-visible:ring-0"
          />
          <p className="text-xs leading-relaxed text-olive">
            Select your profile, copy, paste. LinkedIn doesn&apos;t let apps read
            this for you — see the note at the bottom.
          </p>
        </div>
      </section>

      {/* the one question */}
      <section className="sticker-lg mt-5 rounded-2xl bg-primary/20 p-5">
        <h2 className="font-display text-2xl tracking-wide text-ink">
          What kind of people do you want to meet?
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-bark">
          The only question we ask. Be specific — this is what we match on.
        </p>
        <Textarea
          value={wantToMeet}
          onChange={(e) => setWantToMeet(e.target.value)}
          rows={4}
          maxLength={1000}
          autoFocus
          placeholder="Founders a couple of years ahead of me who've scaled a two-sided marketplace and will tell me bluntly where their cold-start assumptions broke. Not looking to be recruited."
          className="sticker mt-3 rounded-lg text-sm focus-visible:ring-0"
        />
      </section>

      {/* optional refinements */}
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-sand px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-bark">
          City, format and availability{" "}
          <span className="font-normal text-olive">— sensible defaults, adjust if you like</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-olive transition-transform ${showMore ? "rotate-180" : ""}`}
        />
      </button>

      {showMore && (
        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-olive">
              City <span className="font-normal normal-case">(blank = read from your LinkedIn)</span>
            </Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bangalore"
              className="sticker h-11 rounded-lg focus-visible:ring-0"
            />
          </div>
          <TagGrid
            options={FORMAT_OPTIONS}
            value={[format]}
            onChange={(v) => setFormat(v.find((x) => x !== format) ?? format)}
            columns={3}
          />
          <AvailabilityGrid value={availability} onChange={setAvailability} />
        </div>
      )}

      <Button
        type="submit"
        disabled={!ready || busy}
        className="sticker sticker-press mt-7 h-14 w-full rounded-xl bg-roast font-display text-2xl tracking-wide text-white hover:bg-roast disabled:opacity-45"
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Reading your profile…
          </>
        ) : (
          <>
            Join round {roundNumber} <ArrowRight className="ml-1 h-6 w-6" />
          </>
        )}
      </Button>

      <p className="mt-5 rounded-xl border-2 border-dashed border-sand bg-cream p-3 text-xs leading-relaxed text-olive">
        <strong className="text-bark">Why paste instead of connect?</strong>{" "}
        LinkedIn&apos;s public API returns only your name, photo and email — no
        headline, employer or history. Reading a profile needs their partner
        programme, which isn&apos;t self-serve. Pasting is the honest way to get
        the substance we actually match on.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-olive">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function TagList({ title, ids }: { title: string; ids: string[] }) {
  if (!ids?.length) return null;
  return (
    <Field label={title}>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <span
            key={id}
            className="rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-semibold text-bark"
          >
            {tagLabel(id)}
          </span>
        ))}
      </div>
    </Field>
  );
}

/**
 * Offered here rather than during sign-in: a brand new member has no account
 * until enrolment finishes, so there is nothing to attach a password to until
 * this point.
 */
function SetPasswordCard() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="sticker mt-8 flex items-center gap-2 rounded-xl p-4 text-left">
        <KeyRound className="h-4 w-4 shrink-0 text-matcha" />
        <p className="text-sm text-bark">
          Password saved. Next time, sign in with your email and password.
        </p>
      </div>
    );
  }

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save that password.");
        return;
      }
      setSaved(true);
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticker mt-8 rounded-xl p-5 text-left">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-roast" />
        <p className="text-xs font-bold uppercase tracking-wider text-olive">
          Optional — set a password
        </p>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-bark">
        So you can sign straight back in instead of waiting on an email.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 8 characters"
          className="sticker h-11 rounded-lg focus-visible:ring-0"
        />
        <Button
          type="button"
          onClick={save}
          disabled={busy || password.length < 8}
          className="sticker sticker-press h-11 shrink-0 rounded-lg bg-primary px-5 font-display text-lg tracking-wide text-ink hover:bg-primary disabled:opacity-45"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}
