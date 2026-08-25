/**
 * Booking links.
 *
 * Members schedule with each other through their own Calendly (or Cal.com,
 * SavvyCal, whatever they use) rather than through a calendar we keep a copy
 * of. Keeping our own availability grid meant asking everyone to describe
 * their week to us and then keeping that description true, which nobody does.
 * A link they already maintain is both less work and more accurate.
 */

const HOSTS = [
  "calendly.com",
  "cal.com",
  "savvycal.com",
  "zcal.co",
  "meetings.hubspot.com",
  "app.usemotion.com",
  "koalendar.com",
  "tidycal.com",
];

/** Normalise to a canonical https URL, or null if it isn't a booking link. */
export function normaliseBookingUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (!HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  url.protocol = "https:";
  url.hostname = host;
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export const bookingHostLabel = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "booking link";
  }
};

export const SUPPORTED_BOOKING_HOSTS = HOSTS;
