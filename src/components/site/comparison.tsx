import { FadeUp } from "@/components/site/fx";
import { PhoneMock } from "@/components/site/phone";
import { ROUND_LABELS } from "@/lib/schedule";
import { Check, X } from "lucide-react";

const THEIRS = [
  "Hi! I came across your profile and was really impressed…",
  "Hey — would love to pick your brain sometime!",
  "Hi, hope you're well. Quick question about your career…",
  "Hello! Are you open to a quick 15 min chat this week?",
  "Hi! Reaching out because I admire your work at…",
];

export function Comparison() {
  return (
    <div className="flex min-h-screen w-full items-start justify-center px-6 pb-[60px] pt-[60px] md:pt-[80px]">
      <FadeUp className="relative flex w-full max-w-5xl flex-col items-center">
        <h2 className="headline font-display text-center text-[36px] leading-[1.05] tracking-tight text-white md:text-[52px]">
          <span className="block">tired of cold DMs?</span>
          <span className="block italic">brewed is for you</span>
        </h2>

        <div className="mt-12 grid w-full items-start gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center">
            <h3 className="font-display text-center text-[22px] italic leading-tight text-white md:text-[26px]">
              one ready-to-go intro
            </h3>
            <div className="mt-4 flex justify-center">
              <PhoneMock
                bubbles={[
                  { from: "them", text: `☕ Your ${ROUND_LABELS.sendsDay} chat: Jonas Rao — Senior engineer @ Northbound.` },
                  { from: "them", text: "Why you two: you asked for help breaking into infra. He offered it, and he's two steps ahead of you." },
                  { from: "them", text: "jonas@northbound.dev — book him directly." },
                ]}
              />
            </div>
            <ul className="mt-5 flex flex-col gap-2">
              {[
                "They already said yes to meeting someone",
                "You know why you two before you sit down",
                "Their booking link is in the email",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-matcha" strokeWidth={3} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-display text-center text-[22px] italic leading-tight text-white md:text-[26px]">
              forty DMs, two replies
            </h3>
            <div className="mt-4 flex w-full max-w-[19rem] flex-col gap-2">
              {THEIRS.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[0.8rem] text-white/60 backdrop-blur-sm"
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
                <li key={t} className="flex items-start gap-2 text-sm text-white/60">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-berry" strokeWidth={3} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
