import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  hashPassword,
  issueSession,
  normaliseEmail,
  passwordProblem,
  readSession,
} from "@/lib/auth";
import { getProfile, getProfileByEmail, upsertProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Set or replace a password.
 *
 * Reachable with a live session, or straight after a code has been verified
 * (which is the same proof of ownership a session is built from).
 */
export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const password = body.password ?? "";
  const problem = passwordProblem(password);
  if (problem) return NextResponse.json({ error: problem }, { status: 422 });

  const jar = await cookies();
  const sessionId = readSession(jar.get(SESSION_COOKIE)?.value);
  const pending = jar.get("brewed_pending_email")?.value;

  const profile = sessionId
    ? await getProfile(sessionId)
    : pending
      ? await getProfileByEmail(normaliseEmail(pending))
      : null;

  if (!profile) {
    return NextResponse.json(
      { error: "Verify your email before setting a password." },
      { status: 401 },
    );
  }

  await upsertProfile({ ...profile, passwordHash: await hashPassword(password) });

  const response = NextResponse.json({ ok: true });
  // Setting a password from the post-verification screen also signs you in.
  response.cookies.set(SESSION_COOKIE, issueSession(profile.id), SESSION_COOKIE_OPTIONS);
  return response;
}
