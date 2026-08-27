"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { Countdown } from "@/components/site/countdown";
import { Marquee } from "@/components/site/marquee";
import { SunBurst } from "@/components/site/fx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MARQUEE_ORGS } from "@/lib/orgs";

export function Hero({
  members,
  deadlineIso,
  deadlineLabel,
  deadlineFallback,
  zone,
}: {
  members: number;
  deadlineIso: string;
  deadlineLabel: string;
  deadlineFallback: string;
  zone: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    router.push(`/login${q}`);
  };

  return (
    <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 pb-16 pt-24 md:pt-28 2xl:max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        <SunBurst />
        <h1 className="headline font-display relative z-10 -mt-2 text-center text-[44px] leading-[1.05] tracking-tight text-white md:text-[68px] 2xl:text-[84px]">
          <span className="block">Crashh into people</span>
          <span className="block italic">changing the world.</span>
        </h1>
        <p className="relative z-10 mt-5 max-w-xl text-center text-sm leading-relaxed text-white/75 md:text-base">
          One meaningful coffee chat, every Wednesday—with the founders, builders,
          creatives, and thinkers turning ambitious ideas into real impact.
        </p>
      </motion.div>

      <div className="mt-8 flex flex-col items-center 2xl:mt-10">
        <Countdown
          size="hero"
          deadlineIso={deadlineIso}
          label={deadlineLabel.replace(" in", "")}
          zone={zone}
          fallback={deadlineFallback}
        />
        <p className="mt-1 text-sm text-white/80">
          {members === 0
            ? "Nobody has joined yet. Be the first."
            : members === 1
              ? "1 person in the pool so far."
              : `${members.toLocaleString()} people in the pool so far.`}
        </p>
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row"
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@work-or-school.edu"
          aria-label="Your email"
          className="glass-pill h-13 rounded-full px-5 text-base text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-white/50"
        />
        <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="font-display h-13 w-full rounded-full border border-white/20 px-8 text-[20px] italic tracking-normal text-primary-foreground shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:bg-crema sm:w-auto"
          >
            get matched <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </motion.form>

      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/70">
        {["Free to join", "No swiping, ever", "Opt out any week"].map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-matcha" strokeWidth={3} />
            {t}
          </span>
        ))}
      </p>

      <div className="mt-14 w-full">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-white/50">
          for people from places like
        </p>
        <Marquee items={MARQUEE_ORGS} />
      </div>
    </section>
  );
}
