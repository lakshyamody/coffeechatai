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

export function JoinFlow({
  verifiedEmail,
  roundNumber,
  linkedin,
  linkedinEnabled,
}: {
  verifiedEmail: string;
  roundNumber: number;
  /** Present once they've connected LinkedIn. */
  linkedin: { name?: string; picture?: string; email?: string } | null;
  /** False until the LinkedIn app credentials are configured. */
  linkedinEnabled: boolean;
}) {
  const connected = Boolean(linkedin);
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

  const ready = wantToMeet.trim().length >= 10 && (connected || linkedinText.trim().length >= 20 || linkedinUrl.trim());

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
          That&apos;s everything. A confirmation is in your inbox now, and{" "}
          {sendsAt} you&apos;ll get one person, why the two of you, and their
          email address. <strong className="text-ink">You don&apos;t need to come
          back here.</strong>
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

          {/*
            Lead with the model's own words. An earlier version showed the
            taxonomy labels instead — "Can offer: craft, career-path" — which
            reads the same for everybody and made a genuinely specific
            extraction look canned. The tags are still shown, but as what the
            matcher scores on, underneath the prose they came from.
          */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Reads as">
              <p className="text-sm text-bark">{derived.headline}</p>
              {derived.city && <p className="text-sm text-bark">{derived.city}</p>}
            </Field>
            <Phrases label="What you're bringing" items={structured.lifestyle} />
            <Phrases label="A good chat looks like" items={structured.connectionGoals} />
            <Phrases label="Who you'd click with" items={structured.preferences} />
            <Phrases label="Into" items={structured.interests} />
            <Phrases label="Values" items={structured.values} />
          </div>

          {structured.personality && (
            <div className="mt-4 border-t-2 border-dashed border-sand pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-olive">
                How you come across
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Trait label="Sticks to the known" right="Chases novelty" value={structured.personality.openness} />
                <Trait label="Reserved" right="Outgoing" value={structured.personality.energy} />
                <Trait label="Diplomatic" right="Blunt" value={structured.personality.directness} />
                <Trait label="Improvises" right="Comes with an agenda" value={structured.personality.structure} />
              </div>
            </div>
          )}

          <div className="mt-4 border-t-2 border-dashed border-sand pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-olive">
              What the matcher scores on
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <TagList title="Can offer" ids={derived.offers} />
              <TagList title="Looking for" ids={derived.seeks} />
              <TagList title="Topics" ids={derived.topics} />
            </div>
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

        <p className="mt-8 text-sm text-olive">
          If you ever want to change your answer or opt out of a week, it&apos;s
          all on{" "}
          <Link href="/dashboard" className="font-semibold text-roast underline">
            your dashboard
          </Link>
          .
        </p>
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
        {connected
          ? `One question, ${(linkedin?.name ?? "").split(" ")[0] || "and you're in"}`
          : "Connect LinkedIn"}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-bark">
        {connected
          ? "Last step. After this, everything happens in your inbox — the weekly match, who they are, and their email. You never have to come back here."
          : "So we know who you are. Then one question, and you're done."}
      </p>

      <ol className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-olive">
        <li className="text-matcha">1. Email confirmed ✓</li>
        <li className={connected ? "text-matcha" : "text-ink"}>
          2. Connect LinkedIn {connected ? "✓" : ""}
        </li>
        <li className={connected ? "text-ink" : ""}>3. One question</li>
      </ol>

      {/* LinkedIn */}
      <section className="sticker-lg mt-7 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-sky" />
          <h2 className="font-display text-2xl tracking-wide text-ink">
            {connected ? "LinkedIn connected" : "Your LinkedIn"}
          </h2>
        </div>

        {connected ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-ink bg-cream p-3">
            <Avatar
              name={linkedin?.name ?? verifiedEmail}
              seed={7}
              className="h-11 w-11 text-sm"
            />
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight tracking-wide text-ink">
                {linkedin?.name || "Connected"}
              </p>
              <p className="truncate text-xs font-semibold text-olive">
                {linkedin?.email ?? verifiedEmail}
              </p>
            </div>
            <ShieldCheck className="ml-auto h-5 w-5 shrink-0 text-matcha" strokeWidth={2.5} />
          </div>
        ) : linkedinEnabled ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-bark">
              One click. We read your name and confirm it&apos;s you.
            </p>
            <Button
              asChild
              type="button"
              className="sticker sticker-press mt-4 h-12 w-full rounded-xl bg-sky font-display text-xl tracking-wide text-white hover:bg-sky"
            >
              <a href="/api/auth/linkedin/start">
                <BriefcaseBusiness className="mr-2 h-5 w-5" />
                Connect LinkedIn
              </a>
            </Button>
          </>
        ) : (
          <p className="mt-2 rounded-xl border-2 border-dashed border-sand bg-cream p-3 text-xs leading-relaxed text-olive">
            LinkedIn sign-in isn&apos;t configured on this deployment yet, so paste
            your details below instead.
          </p>
        )}

        {/*
          LinkedIn's API hands over a name and nothing else — no headline,
          employer or history. Without something here the matcher has only the
          one question to work from, so this stays available, optional, and
          folded away.
        */}
        <details className="mt-4" open={!connected && !linkedinEnabled}>
          <summary className="cursor-pointer text-xs font-semibold text-bark">
            Add your headline and recent roles{" "}
            <span className="font-normal text-olive">
              — optional, but it&apos;s what makes the match good
            </span>
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="linkedin.com/in/yourname"
              className="sticker h-11 rounded-lg focus-visible:ring-0"
            />
            <Textarea
              value={linkedinText}
              onChange={(e) => setLinkedinText(e.target.value)}
              rows={5}
              maxLength={6000}
              placeholder={`Staff Engineer at Stripe · Bangalore

About: I work on payments reliability — mostly the ledger path and the things that go wrong at p99.`}
              className="sticker rounded-lg text-sm focus-visible:ring-0"
            />
          </div>
        </details>
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
              City
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
        <strong className="text-bark">That&apos;s the last screen.</strong>{" "}
        From here everything arrives by email: your match each week, why the two
        of you, and their address so you can arrange it directly. Nothing to
        check, nothing to log back into.
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

function Phrases({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <Field label={label}>
      <ul className="flex flex-col gap-0.5">
        {items.slice(0, 4).map((i) => (
          <li key={i} className="text-sm leading-snug text-bark">
            &middot; {i}
          </li>
        ))}
      </ul>
    </Field>
  );
}

/** The extractor estimates these; showing them lets someone correct a bad read. */
function Trait({
  label,
  right,
  value,
}: {
  label: string;
  right: string;
  value: number;
}) {
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-cream">
        <div
          className="h-full rounded-full bg-roast transition-all"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[0.65rem] leading-tight text-olive">
        <span>{label}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function TagList({ title, ids }: { title: string; ids: string[] }) {
  if (!ids?.length) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
      <span className="text-xs font-semibold text-olive">{title}:</span>
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
    </div>
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
