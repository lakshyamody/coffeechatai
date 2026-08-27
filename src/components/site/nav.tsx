"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The crashh nav: fixed, transparent until you scroll, wordmark left and
 * frosted pills right. The "join" pill fills white once the page moves.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 transition-all duration-300 md:px-10",
        scrolled ? "py-3 md:py-4" : "py-5 md:py-7",
      )}
    >
      <Link
        href="/"
        className="font-display text-2xl font-bold tracking-tight text-white"
      >
        crashh <span aria-hidden>☕</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="font-display glass-pill rounded-full px-5 py-2 text-base italic"
        >
          Log In
        </Link>
        <Link
          href="/login"
          className={cn(
            "font-display rounded-full border px-5 py-2 text-base italic backdrop-blur-md transition-colors",
            scrolled
              ? "border-white/60 bg-white/70 text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-white/80"
              : "glass-pill",
          )}
        >
          Join Now
        </Link>
      </div>
    </header>
  );
}
