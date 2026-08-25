"use client";

import { BLOCKS, DAYS, hasSlot, popcount, slotIndex, toggleSlot } from "@/lib/availability";
import { cn } from "@/lib/utils";

export function AvailabilityGrid({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const toggleDay = (day: number) => {
    const slots = BLOCKS.map((b) => slotIndex(day, b.id));
    const allOn = slots.every((s) => hasSlot(value, s));
    let next = value;
    for (const s of slots) {
      if (allOn === hasSlot(next, s)) next = toggleSlot(next, s);
    }
    onChange(next);
  };

  const toggleBlock = (block: number) => {
    const slots = DAYS.map((_, d) => slotIndex(d, block));
    const allOn = slots.every((s) => hasSlot(value, s));
    let next = value;
    for (const s of slots) {
      if (allOn === hasSlot(next, s)) next = toggleSlot(next, s);
    }
    onChange(next);
  };

  const count = popcount(value);

  return (
    <div>
      <div className="grid max-w-md grid-cols-[4.5rem_repeat(7,1fr)] gap-1.5">
        <div />
        {DAYS.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDay(i)}
            className="rounded-md py-1 text-xs font-bold text-olive transition-colors hover:bg-sand hover:text-ink"
            title={`Toggle all of ${d}`}
          >
            {d}
          </button>
        ))}

        {BLOCKS.map((block) => (
          <div key={block.id} className="contents">
            <button
              type="button"
              onClick={() => toggleBlock(block.id)}
              className="rounded-md pr-2 text-right transition-colors hover:bg-sand"
              title={`Toggle every ${block.label.toLowerCase()}`}
            >
              <span className="block text-xs font-bold leading-tight text-ink">
                {block.label}
              </span>
              <span className="block text-[0.6rem] leading-tight text-olive">
                {block.hint}
              </span>
            </button>
            {DAYS.map((d, dayIdx) => {
              const slot = slotIndex(dayIdx, block.id);
              const on = hasSlot(value, slot);
              return (
                <button
                  key={`${d}-${block.id}`}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${d} ${block.hint}`}
                  onClick={() => onChange(toggleSlot(value, slot))}
                  className={cn(
                    "aspect-square rounded-md border-2 border-ink transition-all",
                    on
                      ? "bg-matcha shadow-[2px_2px_0_0_var(--color-ink)]"
                      : "bg-white hover:bg-primary/35",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm font-semibold text-bark">
        {count === 0 ? (
          <span className="text-berry">Pick at least 3 blocks.</span>
        ) : count < 3 ? (
          <span className="text-berry">
            {count} block{count === 1 ? "" : "s"} — pick at least 3 so we can find a time.
          </span>
        ) : (
          <>
            <span className="rounded bg-matcha/25 px-1.5 py-0.5">{count} blocks</span>{" "}
            free. More blocks means more people you can actually meet.
          </>
        )}
      </p>
    </div>
  );
}
