"use client";

import { FadeUp, Roman } from "@/components/site/fx";
import { PhoneMock } from "@/components/site/phone";
import {
  AvailabilityPreview,
  MatchCardPreview,
  TagCloudPreview,
} from "@/components/site/step-art";
import { ROUND_LABELS, sendsAtShort } from "@/lib/schedule";

const ROMAN = ["I", "II", "III", "IV"] as const;
const TILT = ["-8deg", "6deg", "-11deg", "9deg"] as const;

export function HowItWorks() {
  const steps = [
    {
      title: "paste your linkedin,\nanswer one question",
      desc: "That's the whole signup. Whatever you can copy from your profile, and one question — what kind of people do you want to meet.",
      art: <TagCloudPreview />,
      side: "left" as const,
    },
    {
      title: `the round runs\n${ROUND_LABELS.closesDay.toLowerCase()} night`,
      desc: "Every opted-in member goes into one pool. The matcher looks at all of it at once — not a feed you scroll — and finds the pairing that's best for both of you.",
      art: <MatchCardPreview />,
      side: "right" as const,
    },
    {
      title: `${sendsAtShort.toLowerCase()}:\none email`,
      desc: "One person. Their headline, why the two of you, four things worth asking — and their email address. We hand you both the introduction and get out of the way.",
      art: (
        <PhoneMock
          title="Inbox"
          bubbles={[
            { from: "them", text: "☕ Your coffee chat: Priya Rao — Staff engineer @ Datadog." },
            { from: "them", text: "Why you two: she asked for help breaking into ML infra. You offered exactly that." },
            { from: "them", text: "priya.rao@datadog.com — she got your address too." },
          ]}
        />
      ),
      side: "left" as const,
    },
    {
      title: "have the chat,\nthen tell us how it went",
      desc: "Their booking link is in the email, so it's one click into their real calendar. Afterwards, rate it — that's what retunes your own matching for next week.",
      art: <AvailabilityPreview />,
      side: "right" as const,
    },
  ];

  return (
    <div id="how" className="mx-auto w-full max-w-5xl px-6 pb-20 pt-2 md:pb-24 2xl:max-w-6xl">
      <div className="mb-10 flex justify-center md:mb-14">
        <h2 className="headline font-display text-center text-[44px] leading-[1.05] tracking-tight text-white md:text-[64px] 2xl:text-[76px]">
          how it works
        </h2>
      </div>

      <div className="flex flex-col gap-10 md:gap-4">
        {steps.map((step, i) => (
          <FadeUp
            key={step.title}
            delay={0.05 * i}
            className={`flex w-full ${
              step.side === "left"
                ? "md:justify-start md:pl-10 2xl:pl-16"
                : "md:justify-end md:pr-10 2xl:pr-16"
            }`}
          >
            <div className="flex w-full flex-col items-center md:w-[52%]">
              <h3 className="headline font-display relative inline-block whitespace-pre-line text-center text-[24px] leading-[1.1] tracking-tight text-white md:text-[32px]">
                <Roman numeral={ROMAN[i]} tilt={TILT[i]} />
                {step.title}
              </h3>
              <p className="mt-2 max-w-[420px] text-center text-[13px] text-white/80 md:text-[14px]">
                {step.desc}
              </p>
              <div className="mt-4 flex w-full justify-center">{step.art}</div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}
