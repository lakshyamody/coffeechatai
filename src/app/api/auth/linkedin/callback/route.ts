import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  LINKEDIN_PENDING_COOKIE,
  LINKEDIN_STATE_COOKIE,
  exchangeCode,
  fetchIdentity,
  validState,
} from "@/lib/linkedin";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, issueSession } from "@/lib/auth";
import { getProfileByEmail, upsertProfile } from "@/lib/store";

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

  const existing = await getProfileByEmail(identity.email);

  if (existing) {
    // Returning member: sign them in and record the LinkedIn identity.
    await upsertProfile({
      ...existing,
      name: existing.name || identity.name,
      emailVerified: true,
      linkedinSub: identity.sub,
    });
    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set(SESSION_COOKIE, issueSession(existing.id), SESSION_COOKIE_OPTIONS);
    response.cookies.delete(LINKEDIN_STATE_COOKIE);
    return response;
  }

  // New member: LinkedIn has proven the address, so skip the emailed code and
  // carry the identity into onboarding. There is no account to attach a
  // session to until they finish enrolling.
  const response = NextResponse.redirect(`${origin}/join`);
  response.cookies.set("brewed_pending_email", identity.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });
  response.cookies.set(
    LINKEDIN_PENDING_COOKIE,
    JSON.stringify({ sub: identity.sub, name: identity.name, picture: identity.picture }),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 },
  );
  response.cookies.delete(LINKEDIN_STATE_COOKIE);
  return response;
}
