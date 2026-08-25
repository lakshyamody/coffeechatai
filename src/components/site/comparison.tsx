import { Check, X } from "lucide-react";
import { Eyebrow } from "@/components/brand";
import { PhoneMock } from "@/components/site/phone";
import { ROUND_SCHEDULE } from "@/lib/schedule";

const THEIRS = [
  "Hi! I came across your profile and was really impressed…",
  "Hey — would love to pick your brain sometime!",
  "Hi, hope you're well. Quick question about your career…",
  "Hello! Are you open to a quick 15 min chat this week?",
  "Hi! Reaching out because I admire your work at…",
];

export function Comparison() {
  return (
    <section className="border-b-2 border-ink bg-paper py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <Eyebrow>Tired of cold DMs?</Eyebrow>
          <h2 className="mt-3 font-display text-5xl leading-none text-ink sm:text-6xl">
            Brewed is for you
          </h2>
        </div>

        <div className="mt-12 grid items-start gap-6 md:grid-cols-2">
          {/* Brewed */}
          <div className="sticker-lg rounded-2xl bg-primary/25 p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-matcha">
                <Check className="h-4 w-4 text-white" strokeWidth={3.5} />
              </span>
              <p className="font-display text-2xl tracking-wide text-ink">
                One intro, ready to go
              </p>
            </div>
            <div className="mt-5 flex justify-center">
              <PhoneMock
                bubbles={[
                  { from: "them", text: `☕ Your ${ROUND_SCHEDULE.sendsDay} chat: Jonas Rao — Senior engineer @ Northbound.` },
                  { from: "them", text: "Why you two: you asked for help breaking into infra. He offered it, and he's two steps ahead of you." },
                  { from: "them", text: "You're both free Thu 2–5pm. Locked in?" },
                ]}
              />
            </div>
            <ul className="mt-5 flex flex-col gap-2">
              {[
                "They already said yes to meeting someone",
                "You know why you two before you sit down",
                "Time picked from calendars you both filled in",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm font-medium text-bark">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-matcha" strokeWidth={3} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Cold outreach */}
          <div className="sticker-lg rounded-2xl bg-sand/70 p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-berry">
                <X className="h-4 w-4 text-white" strokeWidth={3.5} />
              </span>
              <p className="font-display text-2xl tracking-wide text-ink">
                Forty DMs, two replies
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              {THEIRS.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl border-2 border-olive/25 bg-white/60 px-3 py-2 text-[0.8rem] text-olive"
                  style={{ opacity: 1 - i * 0.13 }}
                >
                  {t}
                  <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-wide text-berry">
                    unread
                  </span>
                </div>
              ))}
            </div>
            <ul className="mt-5 flex flex-col gap-2">
              {[
                "No idea if they want to talk to anyone",
                "You're guessing what they'd find useful",
                "Six messages just to find a time",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm font-medium text-olive">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-berry" strokeWidth={3} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
