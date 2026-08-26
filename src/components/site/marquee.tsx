import type { MarqueeOrg } from "@/lib/orgs";
import { cn } from "@/lib/utils";

/**
 * Where members come from — logo and wordmark together.
 *
 * Logos come from each org's own favicon via Google's public favicon
 * service, so there are no trademarked image files in this repo and no
 * asset to keep in sync when a brand refreshes. A plain <img> with a
 * grey fallback: if the icon fails to load the chip still reads fine.
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
            {org.domain && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://www.google.com/s2/favicons?domain=${org.domain}&sz=64`}
                alt=""
                aria-hidden
                width={18}
                height={18}
                loading="lazy"
                className="h-[18px] w-[18px] rounded-[4px] bg-white/90 object-contain p-[1px]"
              />
            )}
            {org.name}
          </span>
        ))}
      </div>
    </div>
  );
}
