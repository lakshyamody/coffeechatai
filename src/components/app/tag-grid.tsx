"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagOption {
  id: string;
  label: string;
  emoji?: string;
  detail?: string;
}

export function TagGrid({
  options,
  value,
  onChange,
  max,
  columns = 2,
}: {
  options: TagOption[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  columns?: 1 | 2 | 3;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
      return;
    }
    if (max && value.length >= max) return;
    onChange([...value, id]);
  };

  const atLimit = max !== undefined && value.length >= max;

  return (
    <div
      className={cn(
        "grid gap-2.5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {options.map((opt) => {
        const active = value.includes(opt.id);
        const disabled = !active && atLimit;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            aria-pressed={active}
            disabled={disabled}
            className={cn(
              "group flex items-start gap-3 rounded-xl border-2 border-ink p-3 text-left transition-all",
              active
                ? "bg-primary shadow-[3px_3px_0_0_var(--color-ink)]"
                : "bg-white shadow-[3px_3px_0_0_var(--color-ink)] hover:-translate-y-0.5",
              disabled && "cursor-not-allowed opacity-40 hover:translate-y-0",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-ink",
                active ? "bg-ink" : "bg-cream",
              )}
            >
              {active && <Check className="h-3 w-3 text-primary" strokeWidth={4} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-snug text-ink">
                {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
                {opt.label}
              </span>
              {opt.detail && (
                <span className="mt-0.5 block text-xs leading-snug text-olive">
                  {opt.detail}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
