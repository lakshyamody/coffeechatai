"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { CoffeeCup, Scribble } from "@/components/brand";
import { Marquee } from "@/components/site/marquee";
import { Button } from "@/components/ui/button";
import { MARQUEE_ORGS } from "@/lib/orgs";
import { Input } from "@/components/ui/input";

const ORGS = MARQUEE_ORGS;

export function Hero({ members }: { members: number }) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    router.push(`/login${q}`);
  };

  return (
    <section className="paper-grain relative overflow-hidden border-b-2 border-ink">
      {/* floating decorations */}
      <CoffeeCup className="absolute left-[6%] top-24 hidden h-16 w-16 -rotate-12 animate-float opacity-70 lg:block" />
      <CoffeeCup className="absolute right-[7%] top-40 hidden h-12 w-12 rotate-12 animate-float opacity-60 lg:block" />

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 text-center sm:pt-20">
        <div className="sticker mx-auto mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-matcha opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-matcha" />
          </span>
          <span className="text-sm font-semibold text-bark">
            This week&apos;s round closes Tuesday, 11:59pm
          </span>
        </div>

        <h1 className="font-display text-6xl leading-[0.92] tracking-tight text-ink sm:text-7xl md:text-8xl">
          One coffee chat.
          <br />
          Every Wednesday.
        </h1>

        <div className="mx-auto mt-4 max-w-md">
          <Scribble className="mx-auto h-3 w-56" />
        </div>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-bark">
          Tell us who you&apos;d like to meet. Wednesday at 7pm we send you{" "}
          <strong className="font-semibold text-ink">one person</strong> worth
          talking to, why you two, and a time you&apos;re both free.
        </p>

        <form
          onSubmit={submit}
          className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@work-or-school.edu"
            aria-label="Your email"
            className="sticker h-12 rounded-lg border-2 text-base placeholder:text-olive/60 focus-visible:ring-0"
          />
          <Button
            type="submit"
            className="sticker sticker-press h-12 shrink-0 rounded-lg bg-primary px-6 font-display text-xl tracking-wide text-ink hover:bg-primary"
          >
            Get matched <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-olive">
          {["Free to join", "No swiping, ever", "Opt out any week"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-matcha" strokeWidth={3} />
              {t}
            </span>
          ))}
        </div>

        <p className="mt-8 text-sm font-medium text-bark">
          {members === 0
            ? "Nobody has joined yet. Be the first."
            : members === 1
              ? "1 person in the pool so far."
              : `${members.toLocaleString()} people in the pool so far.`}
        </p>

      </div>

      <div className="border-t-2 border-ink bg-sand/60 py-4">
        <Marquee items={ORGS} />
      </div>
    </section>
  );
}
