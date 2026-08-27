import { SiteNav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { PinnedReveal } from "@/components/site/pinned-reveal";
import { Proof } from "@/components/site/proof";
import { Matchmaker } from "@/components/site/matchmaker";
import { Comparison } from "@/components/site/comparison";
import { Trust } from "@/components/site/trust";
import { Faq } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta-band";
import { SiteFooter } from "@/components/site/footer";
import { ZigzagSection } from "@/components/site/fx";
import { liveStats } from "@/lib/store";
import { closesAt, roundPhase, sendsAt, zoneAbbreviation } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stats = await liveStats();
  // One clock, on the server, in one timezone. The client only ticks it down.
  const phase = roundPhase();

  return (
    <>
      <SiteNav />
      {/*
        The crashh page structure: one fixed blurred skyline behind
        everything, sections stacked as zigzag-clipped bands whose torn top
        edge bites into the band above.
      */}
      <main className="paper-grain relative min-h-screen w-full overflow-x-clip">
        <ZigzagSection first>
          <Hero
            members={stats.members}
            deadlineIso={phase.deadline.toISOString()}
            deadlineLabel={phase.label}
            deadlineFallback={phase.phase === "open" ? closesAt : sendsAt}
            zone={zoneAbbreviation()}
          />
          <HowItWorks />
        </ZigzagSection>

        <ZigzagSection className="paper-grain skyline-2">
          <PinnedReveal />
        </ZigzagSection>

        <ZigzagSection className="bg-[#1a1a2a]/60 backdrop-blur-sm">
          <Comparison />
        </ZigzagSection>

        <ZigzagSection className="paper-grain skyline-4">
          <Matchmaker />
        </ZigzagSection>

        <ZigzagSection className="bg-[#141c30]/70 backdrop-blur-sm">
          <Proof />
          <Trust />
        </ZigzagSection>

        <ZigzagSection className="bg-[#10182a]/80 backdrop-blur-sm">
          <Faq />
          <CtaBand />
        </ZigzagSection>

        <SiteFooter />
      </main>
    </>
  );
}
