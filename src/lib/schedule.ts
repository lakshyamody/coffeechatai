/**
 * When a round happens.
 *
 * This cadence used to be written out by hand in fourteen places across the
 * marketing copy, the app, and the email templates. It lives here now, along
 * with the date maths that turns it into real instants.
 *
 * Everything is anchored to an explicit IANA zone. "Tuesday 11:59pm" is
 * meaningless to a pool spread across San Francisco, Bangalore and Singapore
 * unless you say whose Tuesday — so the zone is configured, and shown.
 */

export const TIME_ZONE = process.env.BREWED_TIMEZONE ?? "Asia/Kolkata";

export const ROUND_SCHEDULE = {
  /** 0 = Sunday. Entries close here. */
  closesWeekday: 2,
  closesHour: 23,
  closesMinute: 59,
  /** Matches go out here. */
  sendsWeekday: 3,
  sendsHour: 19,
  sendsMinute: 0,
} as const;

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

function clockLabel(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "pm" : "am";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${h}${suffix}` : `${h}:${String(minute).padStart(2, "0")}${suffix}`;
}

export const ROUND_LABELS = {
  closesDay: DAY_NAMES[ROUND_SCHEDULE.closesWeekday],
  closesTime: clockLabel(ROUND_SCHEDULE.closesHour, ROUND_SCHEDULE.closesMinute),
  sendsDay: DAY_NAMES[ROUND_SCHEDULE.sendsWeekday],
  sendsTime: clockLabel(ROUND_SCHEDULE.sendsHour, ROUND_SCHEDULE.sendsMinute),
  sendsTimeLong: `${clockLabel(ROUND_SCHEDULE.sendsHour, ROUND_SCHEDULE.sendsMinute).replace(/(am|pm)/, "").trim()}:00 ${ROUND_SCHEDULE.sendsHour >= 12 ? "PM" : "AM"}`,
} as const;

/**
 * Short zone name as people actually write it — "IST", "PT", "CET".
 *
 * Locale matters here: en-US renders Asia/Kolkata as "GMT+5:30" while en-IN
 * gives "IST". Try the region's own locale first and keep whichever answer
 * looks like an abbreviation rather than an offset.
 */
export function zoneAbbreviation(at: Date = new Date()): string {
  const locales = [
    TIME_ZONE === "Asia/Kolkata" ? "en-IN" : undefined,
    "en-GB",
    "en-US",
  ].filter(Boolean) as string[];
  for (const locale of locales) {
    const value = new Intl.DateTimeFormat(locale, {
      timeZone: TIME_ZONE,
      timeZoneName: "short",
    })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value;
    if (value && !value.startsWith("GMT") && !value.startsWith("UTC")) return value;
  }
  // No abbreviation exists for this zone; the offset is the honest answer.
  return (
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, timeZoneName: "short" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value ?? TIME_ZONE
  );
}

export const closesAt = `${ROUND_LABELS.closesDay}, ${ROUND_LABELS.closesTime}`;
export const sendsAt = `${ROUND_LABELS.sendsDay} at ${ROUND_LABELS.sendsTime}`;
export const sendsAtShort = `${ROUND_LABELS.sendsDay} ${ROUND_LABELS.sendsTime}`;

/* ------------------------------------------------------------------------
   Date maths
   ------------------------------------------------------------------------ */

interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

/** What the wall clock reads in TIME_ZONE at a given instant. */
export function wallClock(at: Date, timeZone = TIME_ZONE): Wall {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    // Intl gives 24 for midnight in some locales; normalise it.
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      weekdayName.slice(0, 3),
    ),
  };
}

/** Zone offset in ms at a given instant (positive means ahead of UTC). */
function offsetMs(at: Date, timeZone = TIME_ZONE): number {
  const w = wallClock(at, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * The instant at which the wall clock in TIME_ZONE reads the given values.
 *
 * Two passes: guess using the offset at the naive instant, then correct with
 * the offset actually in force there. That second pass is what makes this
 * survive daylight-saving transitions in zones that observe them.
 */
export function zonedInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone = TIME_ZONE,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = new Date(naive - offsetMs(new Date(naive), timeZone));
  instant = new Date(naive - offsetMs(instant, timeZone));
  return instant;
}

/** The next time the wall clock hits this weekday and time, at or after `from`. */
export function nextOccurrence(
  weekday: number,
  hour: number,
  minute: number,
  from: Date = new Date(),
  timeZone = TIME_ZONE,
): Date {
  const now = wallClock(from, timeZone);
  let delta = (weekday - now.weekday + 7) % 7;
  let candidate = zonedInstant(
    now.year,
    now.month,
    now.day + delta,
    hour,
    minute,
    timeZone,
  );
  if (candidate.getTime() <= from.getTime()) {
    delta += 7;
    candidate = zonedInstant(now.year, now.month, now.day + delta, hour, minute, timeZone);
  }
  return candidate;
}

export const nextCloseAt = (from: Date = new Date()) =>
  nextOccurrence(
    ROUND_SCHEDULE.closesWeekday,
    ROUND_SCHEDULE.closesHour,
    ROUND_SCHEDULE.closesMinute,
    from,
  );

export const nextSendAt = (from: Date = new Date()) =>
  nextOccurrence(
    ROUND_SCHEDULE.sendsWeekday,
    ROUND_SCHEDULE.sendsHour,
    ROUND_SCHEDULE.sendsMinute,
    from,
  );

export type Phase = "open" | "solving" | "sent";

/**
 * Where we are in the week.
 *
 *   open    — entries accepted, counting down to close
 *   solving — closed, matches not yet out
 *   sent    — matches are out; the next close is what matters now
 */
export function roundPhase(from: Date = new Date()): {
  phase: Phase;
  deadline: Date;
  label: string;
} {
  const close = nextCloseAt(from);
  const send = nextSendAt(from);
  // Between close and send, the next send comes first.
  if (send.getTime() < close.getTime()) {
    return { phase: "solving", deadline: send, label: "Matches go out in" };
  }
  return { phase: "open", deadline: close, label: "This round closes in" };
}

/** The most recent time the wall clock hit this weekday/time, at or before `from`. */
export function previousOccurrence(
  weekday: number,
  hour: number,
  minute: number,
  from: Date = new Date(),
  timeZone = TIME_ZONE,
): Date {
  const next = nextOccurrence(weekday, hour, minute, from, timeZone);
  // Step back a week in wall-clock terms so DST shifts stay correct.
  const w = wallClock(next, timeZone);
  return zonedInstant(w.year, w.month, w.day - 7, hour, minute, timeZone);
}

export const mostRecentCloseAt = (from: Date = new Date()) =>
  previousOccurrence(
    ROUND_SCHEDULE.closesWeekday,
    ROUND_SCHEDULE.closesHour,
    ROUND_SCHEDULE.closesMinute,
    from,
  );

export const mostRecentSendAt = (from: Date = new Date()) =>
  previousOccurrence(
    ROUND_SCHEDULE.sendsWeekday,
    ROUND_SCHEDULE.sendsHour,
    ROUND_SCHEDULE.sendsMinute,
    from,
  );
