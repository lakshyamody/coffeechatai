"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Live countdown to the next round deadline.
 *
 * The target instant is computed on the server (one timezone, one source of
 * truth) and passed in as an ISO string; only the ticking happens here. The
 * first paint deliberately renders the static deadline rather than a
 * duration — a clock rendered on the server is stale by the time it
 * hydrates, and React would flag the mismatch.
 *
 * Two faces: "hero" is the big hot-pink handwritten timer from the crashh
 * landing; "inline" is the compact text strip the dashboard banner uses.
 */
export function Countdown({
  deadlineIso,
  label,
  zone,
  fallback,
  className,
  size = "inline",
}: {
  deadlineIso: string;
  label: string;
  zone: string;
  /** Shown until the client takes over, e.g. "Tuesday, 11:59pm IST". */
  fallback: string;
  className?: string;
  size?: "hero" | "inline";
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(deadlineIso).getTime();
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (size === "hero") {
    const total = Math.max(0, Math.floor((remaining ?? 0) / 1000));
    const display =
      remaining === null
        ? "00:00:00:00"
        : `${pad(Math.floor(total / 86400))}:${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div
          suppressHydrationWarning
          className="font-timer text-[44px] leading-none text-roast mix-blend-hard-light md:text-[60px] 2xl:text-[76px]"
        >
          {remaining !== null && remaining <= 0 ? "brewing…" : display}
        </div>
        <p className="mt-3 text-sm text-white/80">
          {label}: {fallback} ({zone})
        </p>
      </div>
    );
  }

  if (remaining === null) {
    return (
      <span className={className}>
        {label} {fallback}
      </span>
    );
  }

  if (remaining <= 0) {
    return <span className={className}>Solving this round now…</span>;
  }

  const total = Math.floor(remaining / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return (
    <span className={className}>
      {label}{" "}
      <strong className="tabular-nums tracking-wide text-roast">
        {days > 0 && `${days}d `}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </strong>
      <span className="ml-1 text-olive">({zone})</span>
    </span>
  );
}
