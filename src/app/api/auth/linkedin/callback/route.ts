import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  LINKEDIN_PENDING_COOKIE,
  LINKEDIN_STATE_COOKIE,
  exchangeCode,
  fetchIdentity,
  validState,
} from "@/lib/linkedin";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  issueSession,
  readSession,
} from "@/lib/auth";
import { getProfile, getProfileByEmail, upsertProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  if (url.searchParams.get("error")) {
    // The member declined on LinkedIn's screen. Not an error worth shouting about.
    return NextResponse.redirect(`${origin}/login`);
  }

  const jar = await cookies();
  if (!validState(jar.get(LINKEDIN_STATE_COOKIE)?.value, url.searchParams.get("state"))) {
    return fail("That sign-in link expired. Try again.");
  }
  const code = url.searchParams.get("code");
  if (!code) return fail("LinkedIn didn't send an authorisation code.");

  let identity;
  try {
    identity = await fetchIdentity(await exchangeCode(code, origin));
  } catch (error) {
    console.error("[linkedin]", error);
    return fail(error instanceof Error ? error.message : "LinkedIn sign-in failed.");
  }

  // LinkedIn is connected *after* email verification, so there is always a
  // verified address in play. Without one, someone reached this out of order.
  const sessionId = readSession(jar.get(SESSION_COOKIE)?.value);
  const sessionProfile = sessionId ? await getProfile(sessionId) : null;
  const pendingEmail = jar.get("brewed_pending_email")?.value;
  // Same precedence as enroll: a code verified minutes ago outranks a
  // session left behind by whoever used this browser before.
  const verifiedEmail = pendingEmail ?? sessionProfile?.email;

  if (!verifiedEmail) {
    return fail("Confirm your email first, then connect LinkedIn.");
  }

  // Connecting an account whose LinkedIn address differs from the verified
  // one is fine — people sign up with a work address and use a personal
  // LinkedIn. The verified address stays authoritative.
  const existing =
    sessionProfile?.email === verifiedEmail
      ? sessionProfile
      : await getProfileByEmail(verifiedEmail);

  if (existing) {
    // Returning member: sign them in and record the LinkedIn identity.
    await upsertProfile({
      ...existing,
      name: identity.name || existing.name,
      emailVerified: true,
      linkedinSub: identity.sub,
    });
    const response = NextResponse.redirect(`${origin}/join`);
    response.cookies.set(SESSION_COOKIE, issueSession(existing.id), SESSION_COOKIE_OPTIONS);
    response.cookies.set(
      LINKEDIN_PENDING_COOKIE,
      JSON.stringify({ sub: identity.sub, name: identity.name, picture: identity.picture, email: identity.email }),
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 },
    );
    response.cookies.delete(LINKEDIN_STATE_COOKIE);
    return response;
  }

  // Mid-onboarding: carry the identity back to the one remaining question.
  const response = NextResponse.redirect(`${origin}/join`);
  response.cookies.set(
    LINKEDIN_PENDING_COOKIE,
    JSON.stringify({ sub: identity.sub, name: identity.name, picture: identity.picture, email: identity.email }),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 },
  );
  response.cookies.delete(LINKEDIN_STATE_COOKIE);
  return response;
}
