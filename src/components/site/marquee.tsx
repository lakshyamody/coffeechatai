"use client";

import type { MarqueeOrg } from "@/lib/orgs";
import { cn } from "@/lib/utils";

/**
 * Where members come from — logo and wordmark together.
 *
 * Marks are local files (university seals, brand icons). Favicons were
 * empty or the wrong glyph for half the schools. If a file is missing
 * we hide the image and keep the name.
 */
export function Marquee({
  items,
  reverse = false,
  className,
}: {
  items: MarqueeOrg[];
  reverse?: boolean;
  className?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div className={cn("marquee-mask overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max items-center gap-4 whitespace-nowrap py-1",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
      >
        {doubled.map((org, i) => (
          <span
            key={`${org.name}-${i}`}
            className="glass-pill gap-2 px-4 py-1.5 text-sm font-medium text-white/85"
          >
            {org.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo}
                alt=""
                aria-hidden
                width={18}
                height={18}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="h-[18px] w-auto max-w-[32px] rounded-[4px] bg-white object-contain p-[1px]"
              />
            )}
            {org.name}
          </span>
        ))}
      </div>
    </div>
  );
}
