import { SiteNav } from "@/components/site/nav";
import { liveStats } from "@/lib/store";
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
  return (
    <>
      <SiteNav />
      <main>
        <Hero members={stats.members} />
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
