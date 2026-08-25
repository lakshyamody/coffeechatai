/**
 * When a round happens.
 *
 * This cadence was previously written out by hand in fourteen places across
 * the marketing copy, the app, and the email templates. Changing the product
 * to, say, a Thursday send meant finding all fourteen — and missing one meant
 * the site quietly contradicted itself. It lives here now.
 */
export const ROUND_SCHEDULE = {
  /** When entries close. */
  closesDay: "Tuesday",
  closesTime: "11:59pm",
  /** When matches go out. */
  sendsDay: "Wednesday",
  sendsTime: "7pm",
  /** Same moment as sendsTime, written for a header. */
  sendsTimeLong: "7:00 PM",
} as const;

export const closesAt = `${ROUND_SCHEDULE.closesDay}, ${ROUND_SCHEDULE.closesTime}`;
export const sendsAt = `${ROUND_SCHEDULE.sendsDay} at ${ROUND_SCHEDULE.sendsTime}`;
export const sendsAtShort = `${ROUND_SCHEDULE.sendsDay} ${ROUND_SCHEDULE.sendsTime}`;
