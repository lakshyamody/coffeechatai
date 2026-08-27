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

export function CoffeeCup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g className="origin-center">
        <path
          d="M14 26h30v14a13 13 0 0 1-13 13h-4a13 13 0 0 1-13-13V26Z"
          fill="var(--color-paper)"
          stroke="var(--color-ink)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M17 29h24v11a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10V29Z"
          fill="var(--color-roast)"
        />
        <path
          d="M44 30h4a7 7 0 0 1 0 14h-4"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M10 55h38"
          stroke="var(--color-ink)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M23 18c0-4 4-4 4-8" className="animate-steam" />
        <path
          d="M31 16c0-4 4-4 4-8"
          className="animate-steam"
          style={{ animationDelay: "0.7s" }}
        />
      </g>
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
