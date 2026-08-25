"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, Loader2, PartyPopper, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Avatar, Logo } from "@/components/brand";
import { AvailabilityGrid } from "@/components/app/availability-grid";
import { TagGrid, type TagOption } from "@/components/app/tag-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES, cityByName } from "@/lib/cities";
import { DEAL_BREAKERS, type StructuredProfile } from "@/lib/types";
import { popcount } from "@/lib/availability";
import {
  DIRECTION_OPTIONS,
  EXCHANGE_TAGS,
  GOAL_TAGS,
  SENIORITY_LABELS,
  TOPIC_TAGS,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

interface Draft {
  name: string;
  role: string;
  company: string;
  city: string;
  seniority: number;
  goals: string[];
  offers: string[];
  seeks: string[];
  topics: string[];
  direction: string;
  concreteness: number;
  talkativeness: number;
  format: string;
  availability: number;
  dealBreakers: string[];
  workingOn: string;
  greatChat: string;
  avoid: string;
}

interface PreviewMatch {
  name: string;
  headline: string;
  city: string;
  avatarSeed: number;
  score: number;
}

const FORMAT_OPTIONS = [
  { id: "either", label: "Either works", detail: "Most options. Café if we're close, video if not." },
  { id: "virtual", label: "Video only", detail: "Match me anywhere in the world." },
  { id: "in-person", label: "In person only", detail: "Only people in my city — a much smaller pool." },
];

const offerOptions: TagOption[] = EXCHANGE_TAGS.map((t) => ({
  id: t.id,
  label: t.offerLabel ?? t.label,
  emoji: t.emoji,
}));

const seekOptions: TagOption[] = EXCHANGE_TAGS.map((t) => ({
  id: t.id,
  label: t.seekLabel ?? t.label,
  emoji: t.emoji,
}));

const goalOptions: TagOption[] = GOAL_TAGS.map((t) => ({
  id: t.id,
  label: t.label,
  emoji: t.emoji,
}));

const topicOptions: TagOption[] = TOPIC_TAGS.map((t) => ({
  id: t.id,
  label: t.label,
  emoji: t.emoji,
}));

export function JoinFlow({
  verifiedEmail,
  roundNumber,
}: {
  /** Proven by a one-time code before this component ever renders. */
  verifiedEmail: string;
  roundNumber: number;
}) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<PreviewMatch[] | null>(null);
  const [extracted, setExtracted] = useState<StructuredProfile | null>(null);
  const [draft, setDraft] = useState<Draft>({
    name: "",
    role: "",
    company: "",
    city: "San Francisco",
    seniority: 1,
    goals: [],
    offers: [],
    seeks: [],
    topics: [],
    direction: "any",
    concreteness: 0.5,
    talkativeness: 0.5,
    format: "either",
    availability: 0,
    dealBreakers: [],
    workingOn: "",
    greatChat: "",
    avoid: "",
  });

  const set = <K extends keyof Draft>(key: K, val: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const steps = useMemo(
    () => [
      {
        title: "Who are you?",
        blurb: "This is the only part anyone else ever sees.",
        valid: draft.name.trim().length >= 2,
        body: (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name">
                <Input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Priya Rao"
                  className="sticker h-11 rounded-lg focus-visible:ring-0"
                />
              </Field>
              <Field label="Email (verified)">
                <div className="sticker flex h-11 items-center gap-2 rounded-lg px-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-matcha" strokeWidth={2.5} />
                  <span className="truncate text-sm font-semibold text-ink">
                    {verifiedEmail}
                  </span>
                </div>
              </Field>
              <Field label="What you do">
                <Input
                  value={draft.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="Staff engineer"
                  className="sticker h-11 rounded-lg focus-visible:ring-0"
                />
              </Field>
              <Field label="Where">
                <Input
                  value={draft.company}
                  onChange={(e) => set("company", e.target.value)}
                  placeholder="Datadog"
                  className="sticker h-11 rounded-lg focus-visible:ring-0"
                />
              </Field>
            </div>
            <Field label="City">
              <Select value={draft.city} onValueChange={(v) => set("city", v)}>
                <SelectTrigger className="sticker h-11 w-full rounded-lg focus-visible:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                      {c.weight >= 6 ? " · busy" : c.weight >= 3 ? "" : " · quiet"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="How far along are you?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {SENIORITY_LABELS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set("seniority", i)}
                    className={cn(
                      "rounded-lg border-2 border-ink px-2 py-2.5 text-xs font-semibold shadow-[3px_3px_0_0_var(--color-ink)] transition-all",
                      draft.seniority === i
                        ? "bg-primary text-ink"
                        : "bg-white text-bark hover:-translate-y-0.5",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        ),
      },
      {
        title: "What brings you here?",
        blurb: "Pick everything that's true. It steers who we look at.",
        valid: draft.goals.length > 0,
        body: <TagGrid options={goalOptions} value={draft.goals} onChange={(v) => set("goals", v)} columns={2} />,
      },
      {
        title: "What can you offer?",
        blurb:
          "Be honest rather than generous — this is what someone will show up expecting.",
        valid: draft.offers.length > 0,
        body: (
          <TagGrid
            options={offerOptions}
            value={draft.offers}
            onChange={(v) => set("offers", v)}
            max={6}
            columns={2}
          />
        ),
      },
      {
        title: "What are you after?",
        blurb: "The single biggest thing the matcher looks at. Pick up to four.",
        valid: draft.seeks.length > 0,
        body: (
          <TagGrid
            options={seekOptions}
            value={draft.seeks}
            onChange={(v) => set("seeks", v)}
            max={4}
            columns={2}
          />
        ),
      },
      {
        title: "What do you care about?",
        blurb:
          "Rare picks count for more than common ones — two people who both chose quantum is a stronger signal than two who chose AI.",
        valid: draft.topics.length >= 2,
        body: (
          <TagGrid
            options={topicOptions}
            value={draft.topics}
            onChange={(v) => set("topics", v)}
            max={6}
            columns={3}
          />
        ),
      },
      {
        title: "In your own words",
        blurb:
          "The part the checkboxes can't capture. Two or three sentences each is plenty — this is what we read most closely.",
        valid: draft.workingOn.trim().length >= 12,
        body: (
          <div className="flex flex-col gap-5">
            <Field label="What are you working on right now?">
              <Textarea
                value={draft.workingOn}
                onChange={(e) => set("workingOn", e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="Rebuilding our billing system after two failed attempts. Mostly thinking about idempotency and how to migrate without downtime."
                className="sticker rounded-lg text-sm focus-visible:ring-0"
              />
            </Field>
            <Field label="What would make this a great conversation?">
              <Textarea
                value={draft.greatChat}
                onChange={(e) => set("greatChat", e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="Someone who's actually shipped this and will tell me what they'd do differently. I'd rather be argued with than agreed with."
                className="sticker rounded-lg text-sm focus-visible:ring-0"
              />
            </Field>
            <Field label="Anything you'd rather avoid? (optional)">
              <Textarea
                value={draft.avoid}
                onChange={(e) => set("avoid", e.target.value)}
                rows={2}
                maxLength={400}
                placeholder="Not looking to be recruited, and I'd rather not get pitched."
                className="sticker rounded-lg text-sm focus-visible:ring-0"
              />
            </Field>
            <p className="rounded-xl border-2 border-dashed border-sand bg-cream p-3 text-xs leading-relaxed text-olive">
              We read this into a structured profile — your values, how you like
              to talk, what a good outcome looks like — and match on that rather
              than on keywords. You&apos;ll see exactly what we extracted before
              you finish.
            </p>
          </div>
        ),
      },
      {
        title: "Hard noes",
        blurb:
          "These are enforced, not weighted. Anyone matching one of these is removed from your pool entirely.",
        valid: true,
        body: (
          <div className="flex flex-col gap-4">
            <TagGrid
              options={DEAL_BREAKERS.map((d) => ({ id: d.id, label: d.label }))}
              value={draft.dealBreakers}
              onChange={(v) => set("dealBreakers", v)}
              columns={2}
            />
            <p className="rounded-xl border-2 border-dashed border-sand bg-cream p-3 text-xs leading-relaxed text-olive">
              Leave them all unticked if nothing applies — every box you check
              makes your pool smaller. You can change these any week.
            </p>
          </div>
        ),
      },
      {
        title: "Who do you want across the table?",
        blurb: "And what kind of conversation you're in the mood for.",
        valid: true,
        body: (
          <div className="flex flex-col gap-6">
            <TagGrid
              options={DIRECTION_OPTIONS.map((d) => ({
                id: d.id,
                label: d.label,
                detail: d.detail,
                emoji: d.emoji,
              }))}
              value={[draft.direction]}
              onChange={(v) => set("direction", v.find((x) => x !== draft.direction) ?? draft.direction)}
              columns={2}
            />
            <SliderRow
              label="Conversation style"
              left="Open-ended and casual"
              right="Concrete agenda"
              value={draft.concreteness}
              onChange={(v) => set("concreteness", v)}
            />
            <SliderRow
              label="In a chat, you're usually"
              left="Mostly listening"
              right="Mostly talking"
              value={draft.talkativeness}
              onChange={(v) => set("talkativeness", v)}
            />
            <p className="rounded-xl border-2 border-dashed border-sand bg-cream p-3 text-xs leading-relaxed text-olive">
              We pair a talker with a listener rather than two of either — and
              we look for people who want the same <em>kind</em> of
              conversation, even when they want different things from it.
            </p>
          </div>
        ),
      },
      {
        title: "How and when?",
        blurb: "We only ever show your match the overlap, never your full grid.",
        valid: popcount(draft.availability) >= 3,
        body: (
          <div className="flex flex-col gap-6">
            <TagGrid
              options={FORMAT_OPTIONS}
              value={[draft.format]}
              onChange={(v) => set("format", v.find((x) => x !== draft.format) ?? draft.format)}
              columns={3}
            />
            {draft.format === "in-person" && (cityByName(draft.city)?.weight ?? 0) < 5 && (
              <p className="rounded-xl border-2 border-berry/40 bg-berry/10 p-3 text-xs font-semibold text-berry">
                Heads up: {draft.city} is quiet right now. In-person only means
                we can only look at people there, so you may sit out a few
                rounds. &ldquo;Either works&rdquo; would open it up.
              </p>
            )}
            <AvailabilityGrid
              value={draft.availability}
              onChange={(v) => set("availability", v)}
            />
          </div>
        ),
      },
    ],
    [draft, verifiedEmail],
  );

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          utcOffset: cityByName(draft.city)?.offset ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
        return;
      }
      setExtracted(data.structured as StructuredProfile);
      setPreview(data.preview as PreviewMatch[]);
    } catch {
      toast.error("Couldn't reach the matcher. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (preview) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <PartyPopper className="mx-auto h-14 w-14 text-roast" strokeWidth={1.8} />
        <h1 className="mt-5 font-display text-5xl leading-none text-ink">
          You&apos;re in round {roundNumber}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-bark">
          Check your inbox — we&apos;ve emailed you a confirmation. Wednesday at
          7pm you&apos;ll get one person, why the two of you, and their email.
        </p>

        {extracted && (
          <div className="sticker-lg mt-8 rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-roast" />
              <p className="text-xs font-bold uppercase tracking-wider text-olive">
                How we read you
                {extracted.source === "gemini"
                  ? " · via Gemini"
                  : extracted.source === "claude"
                    ? " · via Claude"
                    : " · rules-based fallback"}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink">{extracted.summary}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ExtractList title="Values" items={extracted.values} />
              <ExtractList title="What good looks like" items={extracted.connectionGoals} />
              <ExtractList title="Interests" items={extracted.interests} />
              <ExtractList title="Preferences" items={extracted.preferences} />
            </div>

            {extracted.dealBreakers.length > 0 && (
              <div className="mt-4 border-t-2 border-dashed border-sand pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-olive">
                  Enforced hard noes
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {extracted.dealBreakers.map((d) => (
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
              Wrong about you? Redo the questions any time — we re-read you before
              every round.
            </p>
          </div>
        )}

        <p className="mt-8 text-xs font-bold uppercase tracking-wider text-olive">
          Closest in the pool right now
        </p>

        <div className="mt-8 flex flex-col gap-3 text-left">
          {preview.length === 0 && (
            <p className="sticker rounded-xl p-4 text-sm text-bark">
              Nobody viable in the pool yet — usually that&apos;s in-person only
              in a quiet city, or very few free blocks. You can widen either from
              your dashboard.
            </p>
          )}
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

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <span className="font-display text-lg tracking-wide text-olive">
          {step + 1} / {steps.length}
        </span>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8">
        <h1 className="font-display text-4xl leading-none text-ink sm:text-5xl">
          {current.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-bark">{current.blurb}</p>
      </div>

      <div className="mt-7">{current.body}</div>

      <div className="mt-9 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="font-semibold text-bark hover:bg-sand disabled:opacity-0"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {step < steps.length - 1 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!current.valid}
            className="sticker sticker-press h-12 rounded-xl bg-primary px-7 font-display text-xl tracking-wide text-ink hover:bg-primary disabled:opacity-45"
          >
            Continue <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submit}
            disabled={!current.valid || submitting}
            className="sticker sticker-press h-12 rounded-xl bg-roast px-7 font-display text-xl tracking-wide text-white hover:bg-roast disabled:opacity-45"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Matching…
              </>
            ) : (
              <>Join round {roundNumber}</>
            )}
          </Button>
        )}
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
        So you can sign straight back in instead of waiting on an email. Codes
        keep working either way.
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

function ExtractList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-olive">{title}</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.slice(0, 5).map((i) => (
          <li key={i} className="text-sm leading-snug text-bark">
            &middot; {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-olive">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SliderRow({
  label,
  left,
  right,
  value,
  onChange,
}: {
  label: string;
  left: string;
  right: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wider text-olive">
        {label}
      </Label>
      <Slider
        value={[value]}
        min={0}
        max={1}
        step={0.05}
        onValueChange={([v]) => onChange(v)}
        className="mt-3"
      />
      <div className="mt-2 flex justify-between text-xs font-semibold text-bark">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}
