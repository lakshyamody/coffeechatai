import { cn } from "@/lib/utils";

/** Deterministic avatar palette — same person always gets the same face. */
const PALETTES: Array<[string, string]> = [
  ["#C0562B", "#E25B2C"],
  ["#2FAF51", "#E8C9A0"],
  ["#4285F4", "#B9B689"],
  ["#EF4146", "#F4A574"],
  ["#646446", "#E8C9A0"],
  ["#96421F", "#F0EFDC"],
  ["#1E1D1B", "#C0562B"],
  ["#F5A735", "#3B3B31"],
];

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  seed = 0,
  className,
}: {
  name: string;
  seed?: number;
  className?: string;
}) {
  const [from, to] = PALETTES[Math.abs(seed) % PALETTES.length];
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-full border-2 border-ink shrink-0",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      <span className="font-display text-[0.95em] leading-none text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.55)]">
        {initials(name)}
      </span>
    </div>
  );
}

/** Same globe mark as the landing headline, for logos and empty states. */
export function CoffeeCup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle
        cx="48"
        cy="48"
        r="31"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.9"
      />
      <ellipse
        cx="48"
        cy="48"
        rx="13"
        ry="31"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        opacity="0.7"
      />
      <path
        d="M17 48h62M22 34h52M22 62h52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        opacity="0.7"
      />
      <circle cx="48" cy="48" r="4.5" fill="var(--color-roast)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <CoffeeCup className="h-7 w-7" />
      <span className="font-display text-2xl tracking-wide text-ink">crashh</span>
    </span>
  );
}

/** The small all-caps pixel label that sits above every section heading. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-display text-sm uppercase tracking-[0.22em] text-roast",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Scribble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 12" className={className} fill="none" aria-hidden>
      <path
        d="M2 8c30-6 62-7 96-4 34 3 66 2 100-3"
        stroke="var(--color-roast)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
