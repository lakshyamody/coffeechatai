import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CoffeeCup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ROUND_LABELS } from "@/lib/schedule";

export function CtaBand() {
  return (
    <section className="border-b-2 border-ink bg-roast py-20 text-paper">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <CoffeeCup className="mx-auto h-16 w-16 animate-float" />
        <h2 className="mt-6 font-display text-5xl leading-none sm:text-6xl">
          This round closes {ROUND_LABELS.closesDay}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-paper/85">
          Six minutes now, one conversation {ROUND_LABELS.sendsDay}. Opt out any week you
          don&apos;t feel like it.
        </p>
        <Button
          asChild
          className="sticker sticker-press mt-8 h-14 rounded-xl bg-primary px-8 font-display text-2xl tracking-wide text-ink hover:bg-primary"
        >
          <Link href="/login">
            Get matched <ArrowRight className="ml-1 h-6 w-6" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
