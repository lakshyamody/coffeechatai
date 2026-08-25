"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to the next round deadline.
 *
 * The target instant is computed on the server (one timezone, one source of
 * truth) and passed in as an ISO string; only the ticking happens here. The
 * first paint deliberately renders the static deadline rather than a
 * duration — a clock rendered on the server is stale by the time it
 * hydrates, and React would flag the mismatch.
 */
export function Countdown({
  deadlineIso,
  label,
  zone,
  fallback,
  className,
}: {
  deadlineIso: string;
  label: string;
  zone: string;
  /** Shown until the client takes over, e.g. "Tuesday, 11:59pm IST". */
  fallback: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(deadlineIso).getTime();
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

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
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className={className}>
      {label}{" "}
      <strong className="font-display tabular-nums tracking-wide">
        {days > 0 && `${days}d `}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </strong>
      <span className="ml-1 text-olive">({zone})</span>
    </span>
  );
}
