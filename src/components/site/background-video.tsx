"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-bleed background video for a `.paper-grain` band.
 *
 * Layering: the band's CSS `::before` (the blurred still image) paints first,
 * this video paints over it at the same negative z, and the band's `::after`
 * gradient overlay stays on top of both — so text keeps its dark scrim, and
 * if the video never loads the still is what shows.
 *
 * Reduced motion: the video element is only mounted after a client-side
 * `prefers-reduced-motion: no-preference` check. Users who prefer reduced
 * motion never mount it — and never download it — and keep today's static
 * image backdrop. The band's `::after` normally backdrop-blurs everything
 * beneath it (that blur IS the image aesthetic); a `:has([data-bg-video])`
 * rule in globals.css lifts the blur only while a video is actually mounted,
 * so the fallback keeps its look.
 */
export function BackgroundVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const update = () => setMotionOk(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!motionOk) return;
    videoRef.current?.play().catch(() => {});
  }, [motionOk]);

  if (!motionOk) return null;

  return (
    <video
      ref={videoRef}
      data-bg-video=""
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={poster}
      src={src}
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-[-2] h-full w-full select-none object-cover",
        "brightness-[0.8] saturate-[1.1]",
        "motion-reduce:hidden",
        className,
      )}
    />
  );
}

export function SiteBackdrop({
  poster = "/landing_bg.jpg",
}: {
  poster?: string;
}) {
  return <BackgroundVideo src="/videos/background-1.mp4" poster={poster} />;
}
