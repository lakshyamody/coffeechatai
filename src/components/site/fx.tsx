"use client";

import {
  MotionValue,
  motion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------
   Animation toolkit, ported from the crashh landing.
   ------------------------------------------------------------------------ */

/**
 * The jagged paper-tear edge between sections. Each section clips its own
 * top into a row of teeth and pulls itself up over the previous section by
 * the tooth height, so the band behind shows through the notches.
 */
export function buildZigzagClip(teeth: number, toothHeightPx: number): string {
  const segments = teeth * 2;
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (i * 100) / segments;
    const y = i % 2 === 0 ? toothHeightPx : 0;
    pts.push(`${x.toFixed(4)}% ${y}px`);
  }
  pts.push(`100% 100%`);
  pts.push(`0% 100%`);
  return `polygon(${pts.join(", ")})`;
}

export function ZigzagSection({
  children,
  className,
  first = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  /** The first band has nothing above it to bite into. */
  first?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("relative w-full", !first && "-mt-[22px]", className)}
      style={first ? undefined : { clipPath: buildZigzagClip(28, 22) }}
    >
      {children}
    </section>
  );
}

/** The standard crashh entrance: drift down and fade in when scrolled into view. */
export function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** A slow-tilting globe that sits above the big headlines. */
export function SunBurst({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 96 96"
      aria-hidden
      className={cn("h-14 w-14 select-none text-white md:h-20 md:w-20", className)}
      animate={{ rotate: [-5, 5, -5] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
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
    </motion.svg>
  );
}

/**
 * Scroll-driven typewriter: each character warms from grey to white as the
 * pinned section's progress passes over it.
 */
export function TypewriterLines({
  lines,
  progress,
  start = 0.15,
  end = 0.55,
  fromColor = "#7a808c",
  toColor = "#ffffff",
}: {
  lines: string[];
  progress: MotionValue<number>;
  start?: number;
  end?: number;
  fromColor?: string;
  toColor?: string;
}) {
  const total = lines.reduce((n, l) => n + l.length, 0);
  const step = (end - start) / Math.max(total, 1);
  let idx = 0;
  return (
    <>
      {lines.map((line, li) => {
        const chars = Array.from(line).map((ch) => {
          const i = idx++;
          return (
            <ColorChar
              key={`${li}-${i}`}
              char={ch}
              progress={progress}
              start={start + i * step}
              end={start + (i + 1) * step}
              fromColor={fromColor}
              toColor={toColor}
            />
          );
        });
        return (
          <span key={li} className="block">
            {chars}
          </span>
        );
      })}
    </>
  );
}

function ColorChar({
  char,
  progress,
  start,
  end,
  fromColor,
  toColor,
}: {
  char: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
  fromColor: string;
  toColor: string;
}) {
  const color = useTransform(progress, [start, end], [fromColor, toColor]);
  return (
    <motion.span style={{ color }}>{char === " " ? " " : char}</motion.span>
  );
}

/**
 * The tilted roman numeral that sits beside crashh headings.
 */
export function Roman({
  numeral,
  tilt = "-8deg",
  className,
}: {
  numeral: string;
  tilt?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "absolute -left-3 -top-4 inline-block text-[12px] text-white/60 md:-left-4 md:-top-5 md:text-[15px]",
        className,
      )}
      style={{ transform: `rotate(${tilt})` }}
    >
      {numeral}.
    </span>
  );
}

/**
 * Deck of cards driven by a pinned section's scroll progress: the active
 * card flies off left as the next one steps forward. Ported from the
 * polaroid carousel, generalised to take any children.
 */
export function ScrollDeck({
  progress,
  children,
  className,
}: {
  progress: MotionValue<number>;
  children: React.ReactNode[];
  className?: string;
}) {
  const count = children.length;
  const active = useTransform(progress, [0, 1], [0, count - 1]);
  const rotations = [5, -3, 4, -5, 3];
  return (
    <div className={cn("relative h-[420px] w-full md:h-[500px]", className)}>
      {children.map((child, i) => (
        <DeckCard key={i} index={i} active={active} baseRotate={rotations[i % rotations.length]}>
          {child}
        </DeckCard>
      ))}
    </div>
  );
}

function DeckCard({
  index,
  active,
  baseRotate,
  children,
}: {
  index: number;
  active: MotionValue<number>;
  baseRotate: number;
  children: React.ReactNode;
}) {
  const signed = useTransform(active, (v) => index - v);
  const x = useTransform(signed, (v) => (v < 0 ? v * 900 : 0));
  const y = useTransform(signed, (v) => (v < 0 ? v * 60 : v * 16));
  const scale = useTransform(signed, (v) =>
    v < 0 ? Math.max(0.85, 1 + v * 0.15) : Math.max(0.65, 1 - v * 0.07),
  );
  const opacity = useTransform(signed, (v) => {
    if (v < -0.9) return 0;
    if (v < 0) return Math.max(0, 1 + v * 1.1);
    return 1;
  });
  const rotate = useTransform(signed, (v) =>
    v < 0 ? baseRotate + v * 18 : baseRotate,
  );
  const zIndex = useTransform(signed, (v) =>
    v < -0.5 ? 0 : Math.round(200 - Math.max(0, v) * 10),
  );

  return (
    <motion.div
      style={{
        left: "50%",
        top: "50%",
        translateX: "-50%",
        translateY: "-50%",
        x,
        y,
        scale,
        rotate,
        opacity,
        zIndex,
      }}
      className="absolute drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
    >
      {/*
        The polaroids this replaces were opaque photographs; our cards are
        frosted glass. Without a solid backing the whole deck shows through
        itself and reads as a jumble, so each card sits on solid navy.
      */}
      <div className="rounded-3xl bg-[#1e2a45]">{children}</div>
    </motion.div>
  );
}
