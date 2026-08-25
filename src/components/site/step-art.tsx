import { Check } from "lucide-react";
import { Avatar } from "@/components/brand";
import { BLOCKS, DAYS } from "@/lib/availability";

/** Step 1 — what the questionnaire feels like. */
export function TagCloudPreview() {
  const offers = ["Referrals at my company", "Deep technical review", "Managing people"];
  const seeks = ["Help raising", "Someone in the same trenches"];
  return (
    <div className="sticker-lg w-full max-w-sm rounded-2xl p-5">
      <p className="font-display text-lg tracking-wide text-ink">I can offer</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {offers.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-primary px-3 py-1 text-xs font-semibold text-ink"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
            {t}
          </span>
        ))}
      </div>
      <p className="mt-5 font-display text-lg tracking-wide text-ink">I&apos;m looking for</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {seeks.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-roast px-3 py-1 text-xs font-semibold text-white"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
            {t}
          </span>
        ))}
      </div>
      <div className="mt-5 border-t-2 border-dashed border-sand pt-3 text-xs text-olive">
        Both sides use the same list — that&apos;s what lets the matcher line
        one person&apos;s offer up against another&apos;s ask.
      </div>
    </div>
  );
}

/** Step 2 — the score, shown honestly. */
export function MatchCardPreview() {
  const bars = [
    { label: "Reciprocity", value: 0.86, color: "var(--color-roast)" },
    { label: "Resonance", value: 0.71, color: "var(--color-crema)" },
    { label: "Complementarity", value: 0.64, color: "var(--color-matcha)" },
    { label: "Logistics", value: 0.79, color: "var(--color-sky)" },
    { label: "Serendipity", value: 0.52, color: "var(--color-olive)" },
  ];
  return (
    <div className="sticker-lg w-full max-w-sm rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg tracking-wide text-ink">
          Pair score
          <span className="ml-2 rounded-full border border-olive/40 px-1.5 py-0.5 align-middle text-[0.55rem] font-bold uppercase tracking-wider text-olive">
            example
          </span>
        </p>
        <span className="font-display text-3xl text-roast">74</span>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-xs font-semibold text-bark">
              <span>{b.label}</span>
              <span className="tabular-nums text-olive">
                {Math.round(b.value * 100)}
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-cream">
              <div
                className="h-full rounded-full"
                style={{ width: `${b.value * 100}%`, background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t-2 border-dashed border-sand pt-3 text-xs text-olive">
        You can see every number behind your match. No black box.
      </p>
    </div>
  );
}

/** Step 4 — the shared calendar. */
export function AvailabilityPreview() {
  const yours = new Set([1, 2, 5, 6, 9, 10, 13, 14, 17, 18, 21]);
  const theirs = new Set([2, 6, 7, 10, 11, 14, 15, 18, 22]);
  return (
    <div className="sticker-lg w-full max-w-sm rounded-2xl p-5">
      <p className="font-display text-lg tracking-wide text-ink">When you overlap</p>
      <div className="mt-3 grid grid-cols-[auto_repeat(7,1fr)] gap-1">
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[0.6rem] font-bold text-olive">
            {d[0]}
          </div>
        ))}
        {BLOCKS.map((block) => (
          <div key={block.id} className="contents">
            <div className="pr-1 text-right text-[0.6rem] font-bold text-olive">
              {block.label}
            </div>
            {DAYS.map((d, dayIdx) => {
              const slot = dayIdx * BLOCKS.length + block.id;
              const both = yours.has(slot) && theirs.has(slot);
              const one = yours.has(slot) || theirs.has(slot);
              return (
                <div
                  key={`${d}-${block.id}`}
                  className={`aspect-square rounded-[3px] border ${
                    both
                      ? "border-ink bg-matcha"
                      : one
                        ? "border-sand bg-primary/45"
                        : "border-sand bg-cream"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 border-t-2 border-dashed border-sand pt-3">
        <div className="flex -space-x-2">
          <Avatar name="You" seed={4} className="h-7 w-7 text-[0.55rem]" />
          <Avatar name="Them" seed={1} className="h-7 w-7 text-[0.55rem]" />
        </div>
        <p className="text-xs font-semibold text-bark">
          <span className="rounded bg-matcha/25 px-1">4 blocks</span> you&apos;re
          both free
        </p>
      </div>
    </div>
  );
}
