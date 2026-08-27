import { cookies } from "next/headers";
import { emailConfigured } from "./email";

/**
 * Operator-only pages.
 *
 * /outbox and /lab were open. That was defensible while nothing real flowed
 * through them — the outbox was a local stand-in for a mail provider and the
 * pool was empty. It stopped being defensible the moment real mail started
 * going to real people: the outbox renders every message it has sent,
 * including sign-in codes, so an open /outbox is an account-takeover page for
 * anyone who knows the URL.
 *
 * Gate: unlocked only when there is nothing real to protect (no mail
 * provider, i.e. a local demo), or when the caller presents the admin token.
 */
export const ADMIN_COOKIE = "brewed_admin";

export function adminTokenConfigured(): boolean {
  return Boolean(process.env.BREWED_ADMIN_TOKEN);
}

export async function isOperator(searchToken?: string): Promise<boolean> {
  // A deployment with no mail provider is a local demo; nothing to leak.
  if (!emailConfigured()) return true;

  const expected = process.env.BREWED_ADMIN_TOKEN;
  if (!expected) return false; // fail closed

  if (searchToken && searchToken === expected) return true;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === expected;
}

/** Codes are single-use and short-lived, but they should never be rendered. */
export function redactCodes(text: string): string {
  return text
    .replace(/\b\d{6}\b(?=\s+is your \w+ code)/g, "••••••")
    .replace(/(letter-spacing:10px[^>]*>)\s*\d{6}\s*(<)/g, "$1••••••$2")
    .replace(/Your \w+ code is \d{6}/g, "Your code is ••••••");
}
