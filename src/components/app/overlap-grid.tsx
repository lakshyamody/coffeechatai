import { BLOCKS, DAYS, hasSlot, slotIndex } from "@/lib/availability";
import { cn } from "@/lib/utils";

/**
 * Read-only overlap view. Deliberately shows only the intersection plus
 * "one of you" — never which of the two is free at a given hour.
 */
export function OverlapGrid({
  mine,
  theirs,
  highlight,
}: {
  mine: number;
  theirs: number;
  highlight?: number | null;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_repeat(7,1fr)] gap-1">
      <div />
      {DAYS.map((d) => (
        <div key={d} className="text-center text-[0.65rem] font-bold text-olive">
          {d}
        </div>
      ))}
      {BLOCKS.map((block) => (
        <div key={block.id} className="contents">
          <div className="pr-1 text-right text-[0.65rem] font-bold leading-tight text-olive">
            {block.label}
          </div>
          {DAYS.map((d, dayIdx) => {
            const slot = slotIndex(dayIdx, block.id);
            const both = hasSlot(mine, slot) && hasSlot(theirs, slot);
            const one = hasSlot(mine, slot) || hasSlot(theirs, slot);
            return (
              <div
                key={`${d}-${block.id}`}
                title={both ? "You're both free" : one ? "One of you is free" : ""}
                className={cn(
                  "aspect-square rounded-[4px] border-2",
                  both
                    ? "border-ink bg-matcha"
                    : one
                      ? "border-sand bg-primary/30"
                      : "border-sand bg-white",
                  highlight === slot && "ring-2 ring-roast ring-offset-1",
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
