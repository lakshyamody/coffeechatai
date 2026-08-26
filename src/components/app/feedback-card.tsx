"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Star, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ScoreTerm } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAGS = [
  "great depth",
  "genuinely useful",
  "good chemistry",
  "learned something",
  "too salesy",
  "no chemistry",
  "wrong level",
  "one-sided",
];

const TERM_LABEL: Record<string, string> = {
  reciprocity: "having what the other asked for",
  resonance: "shared context",
  complementarity: "the right gap in experience",
  logistics: "easy scheduling",
  character: "values and personality fit",
  serendipity: "meeting someone different",
};

export function FeedbackCard({ matchName }: { matchName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    observations: number;
    highlights: Array<{ term: ScoreTerm; delta: number }>;
  } | null>(null);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save that.");
        return;
      }
      setResult({ observations: data.observations, highlights: data.highlights });
      toast.success("Thanks — your next match is tuned on this.");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="sticker rounded-xl p-5">
        <p className="font-display text-xl tracking-wide text-ink">
          Your matching just moved
        </p>
        <p className="mt-1 text-sm text-bark">
          Trained on {result.observations} rated chat
          {result.observations === 1 ? "" : "s"}. Where your weights went:
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {result.highlights.map((h) => (
            <div key={h.term} className="flex items-center gap-2 text-sm">
              {h.delta >= 0 ? (
                <TrendingUp className="h-4 w-4 shrink-0 text-matcha" />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0 text-berry" />
              )}
              <span className="text-bark">
                {h.delta >= 0 ? "More" : "Less"} weight on{" "}
                <strong className="text-ink">{TERM_LABEL[h.term] ?? h.term}</strong>
              </span>
              <span className="ml-auto font-mono text-xs tabular-nums text-olive">
                {h.delta >= 0 ? "+" : ""}
                {(h.delta * 100).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sticker rounded-xl p-5">
      <p className="font-display text-xl tracking-wide text-ink">
        Already met {matchName.split(" ")[0]}?
      </p>
      <p className="mt-1 text-sm text-bark">
        Rating it retrains your own matching weights — this is the only thing
        that personalises your next round.
      </p>

      <div className="mt-4 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} out of 5`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-8 w-8",
                (hover || rating) >= n
                  ? "fill-primary text-ink"
                  : "fill-white text-ink/40",
              )}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={cn(
                  "rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold transition-all",
                  tags.includes(t)
                    ? "bg-roast text-[#191104]"
                    : "bg-white/10 text-bark hover:-translate-y-0.5",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Button
            onClick={submit}
            disabled={busy}
            className="sticker sticker-press mt-4 h-11 rounded-lg bg-primary px-5 font-display text-lg tracking-wide text-primary-foreground hover:bg-primary"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save feedback
          </Button>
        </>
      )}
    </div>
  );
}
