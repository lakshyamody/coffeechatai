import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { T, exec, queryOne } from "./db";

/**
 * Email-code auth.
 *
 * No passwords: prove you can read the inbox and you're in. Codes are stored
 * hashed, expire in 10 minutes, and are burned after 5 wrong guesses so the
 * 6-digit space can't be walked.
 *
 * Sessions are stateless HMAC tokens, so a server restart doesn't sign
 * everyone out mid-round.
 */

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "brewed_session";

function secret(): string {
  return (
    process.env.BREWED_SESSION_SECRET ??
    // Dev-only fallback. Set BREWED_SESSION_SECRET in any real deployment —
    // without it, sessions are forgeable by anyone reading this source.
    "brewed-dev-secret-do-not-use-in-production"
  );
}

interface ChallengeRow {
  email: string;
  code_hash: string;
  /** Postgres returns BIGINT as a string; always coerce before comparing. */
  expires_at: number | string;
  attempts: number | string;
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export const isEmail = (email: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

function hash(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Create a challenge and return the plaintext code for delivery by email. */
export async function createChallenge(
  emailRaw: string,
): Promise<{ email: string; code: string }> {
  const email = normaliseEmail(emailRaw);
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await exec(
    `INSERT INTO ${T}challenges (email, code_hash, expires_at, attempts)
     VALUES (?, ?, ?, 0)
     ON CONFLICT (email) DO UPDATE SET
       code_hash = EXCLUDED.code_hash,
       expires_at = EXCLUDED.expires_at,
       attempts = 0`,
    [email, hash(`${email}:${code}`), Date.now() + CODE_TTL_MS],
  );
  return { email, code };
}

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: "no-challenge" | "expired" | "too-many-attempts" | "wrong-code" };

export async function verifyChallenge(
  emailRaw: string,
  code: string,
): Promise<VerifyResult> {
  const email = normaliseEmail(emailRaw);
  const drop = () => exec(`DELETE FROM ${T}challenges WHERE email = ?`, [email]);

  const challenge = await queryOne<ChallengeRow>(
    `SELECT email, code_hash, expires_at, attempts FROM ${T}challenges WHERE email = ?`,
    [email],
  );

  if (!challenge) return { ok: false, reason: "no-challenge" };
  if (Date.now() > Number(challenge.expires_at)) {
    await drop();
    return { ok: false, reason: "expired" };
  }
  if (Number(challenge.attempts) >= MAX_ATTEMPTS) {
    await drop();
    return { ok: false, reason: "too-many-attempts" };
  }

  await exec(`UPDATE ${T}challenges SET attempts = attempts + 1 WHERE email = ?`, [email]);

  if (!safeEqual(challenge.code_hash, hash(`${email}:${code.trim()}`))) {
    return { ok: false, reason: "wrong-code" };
  }

  await drop();
  return { ok: true, email };
}

/* ------------------------------------------------------------------------
   Sessions
   ------------------------------------------------------------------------ */

export function issueSession(profileId: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${profileId}.${expires}`;
  return `${payload}.${hash(payload)}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [profileId, expiresRaw, signature] = parts;
  const payload = `${profileId}.${expiresRaw}`;
  if (!safeEqual(signature, hash(payload))) return null;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;
  return profileId;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
} as const;

/* ------------------------------------------------------------------------
   Passwords
   Optional. Email codes always work; a password just saves you the round
   trip to your inbox on every sign-in.
   ------------------------------------------------------------------------ */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const SCRYPT_KEYLEN = 64;

export const PASSWORD_MIN = 8;

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Use at least ${PASSWORD_MIN} characters.`;
  }
  if (password.length > 200) return "That's too long.";
  return null;
}

/** `scrypt$<salt>$<hash>` — salt per password, no pepper beyond the salt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | undefined,
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  const a = Buffer.from(expected, "hex");
  if (a.length !== derived.length) return false;
  return timingSafeEqual(a, derived);
}
