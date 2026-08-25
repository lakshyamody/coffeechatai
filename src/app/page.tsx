import { SiteNav } from "@/components/site/nav";
import { liveStats } from "@/lib/store";
import { closesAt, roundPhase, sendsAt, zoneAbbreviation } from "@/lib/schedule";
import { Hero } from "@/components/site/hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { Proof } from "@/components/site/proof";
import { Matchmaker } from "@/components/site/matchmaker";
import { Comparison } from "@/components/site/comparison";
import { Trust } from "@/components/site/trust";
import { Faq } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta-band";
import { SiteFooter } from "@/components/site/footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stats = await liveStats();
  // One clock, on the server, in one timezone. The client only ticks it down.
  const phase = roundPhase();
  return (
    <>
      <SiteNav />
      <main>
        <Hero
          members={stats.members}
          deadlineIso={phase.deadline.toISOString()}
          deadlineLabel={phase.label}
          deadlineFallback={phase.phase === "open" ? closesAt : sendsAt}
          zone={zoneAbbreviation()}
        />
        <HowItWorks />
        <Proof />
        <Matchmaker />
        <Comparison />
        <Trust />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
