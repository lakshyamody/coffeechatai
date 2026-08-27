import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeUp, SunBurst } from "@/components/site/fx";
import { ROUND_LABELS } from "@/lib/schedule";

export function CtaBand() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-6 py-[80px]">
      <FadeUp className="flex flex-col items-center text-center">
        <SunBurst />
        <h2 className="headline font-display text-[44px] leading-[1.05] tracking-tight text-white md:text-[64px]">
          <span className="block">from the world&apos;s best</span>
          <span className="block italic">over coffee</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/75">
          People who will make you greater, from the places that already are.
          This round closes {ROUND_LABELS.closesDay}.
        </p>
        <Link
          href="/login"
          className="glass-pill font-display mt-8 rounded-full px-[60px] py-[14px] text-[22px] italic tracking-normal shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:px-[80px]"
        >
          get matched <ArrowRight className="ml-2 inline h-5 w-5" />
        </Link>
      </FadeUp>
    </div>
  );
}
