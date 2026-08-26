"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { ScrollDeck, TypewriterLines } from "@/components/site/fx";
import { MatchCardPreview, TagCloudPreview } from "@/components/site/step-art";
import { PhoneMock } from "@/components/site/phone";

const HEADLINE_LINES = ["brewed into your", "next conversation"];
const FACT_LINES = ["one intro a week,", "zero cold DMs"];

/**
 * The signature crashh scroll piece: a 400vh band pins to the viewport and
 * scrolling drives everything — the headline types itself in, a deck of
 * cards steps forward as the old one flies off, and the caption warms from
 * grey to white at the end.
 *
 * The dating version dealt polaroids of couples; this one deals the actual
 * product — the signup card, the score card, the match email.
 */
export function PinnedReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: entryProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  const { scrollYProgress: pinProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const deckProgress = useTransform(pinProgress, [0.05, 1.0], [0, 1]);
  const captionColor = useTransform(
    deckProgress,
    [0.5, 1.0],
    ["rgba(122, 128, 140, 0.85)", "rgba(255, 255, 255, 0.85)"],
  );

  return (
    <div ref={ref} className="relative h-[400vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="relative mx-auto flex h-full max-w-5xl flex-col items-start px-6 pt-16 md:pt-20 2xl:max-w-6xl">
          <h2 className="headline font-display text-left text-[44px] leading-[1.05] tracking-tight md:text-[64px] 2xl:text-[80px]">
            <TypewriterLines
              lines={HEADLINE_LINES}
              progress={entryProgress}
              start={0.5}
              end={1.0}
            />
          </h2>

          <div className="relative flex w-full flex-1 items-center">
            <ScrollDeck progress={deckProgress} className="scale-[0.85] md:scale-100">
              <TagCloudPreview />
              <MatchCardPreview />
              <PhoneMock
                title="Inbox"
                bubbles={[
                  { from: "them", text: "☕ Your coffee chat this week: Jonas Rao." },
                  { from: "them", text: "You asked for someone who's scaled a marketplace. He has, twice." },
                  { from: "them", text: "jonas@northbound.dev — book him directly." },
                ]}
              />
            </ScrollDeck>
          </div>

          <div className="absolute bottom-16 right-6 md:bottom-20 md:right-10">
            <h3 className="headline font-display text-right text-[22px] italic leading-[1.05] tracking-tight md:text-[32px]">
              <TypewriterLines
                lines={FACT_LINES}
                progress={deckProgress}
                start={0}
                end={0.5}
              />
            </h3>
            <motion.p
              style={{ color: captionColor }}
              className="ml-auto mt-3 max-w-[240px] text-right text-[12px] leading-snug md:max-w-[300px] md:text-[14px]"
            >
              No feeds, no swiping, no scheduling threads. The whole product is
              one good email a week — and it reads the room better every time
              you rate a chat.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
