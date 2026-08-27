import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  issueSession,
  verifyChallenge,
} from "@/lib/auth";
import { getProfileByEmail, upsertProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  "no-challenge": "Ask for a new code — that one's gone.",
  expired: "That code expired. Send yourself a fresh one.",
  "too-many-attempts": "Too many wrong guesses. Request a new code.",
  "wrong-code": "That code isn't right.",
};

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as { email?: string; code?: string };
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const result = await verifyChallenge(body.email ?? "", body.code ?? "");
  if (!result.ok) {
    return NextResponse.json(
      { error: MESSAGES[result.reason] ?? "Couldn't verify that code." },
      { status: 401 },
    );
  }

  const existing = await getProfileByEmail(result.email);
  if (existing && !existing.emailVerified) {
    await upsertProfile({ ...existing, emailVerified: true });
  }

  const response = NextResponse.json({
    ok: true,
    email: result.email,
    /** No profile yet means they still have to fill in the questionnaire. */
    enrolled: Boolean(existing),
    next: existing ? "/dashboard" : "/join",
  });

  if (existing) {
    response.cookies.set(SESSION_COOKIE, issueSession(existing.id), SESSION_COOKIE_OPTIONS);
    // Drop any pending address from an earlier abandoned signup — this code
    // is a newer proof of who's at the keyboard.
    response.cookies.set("brewed_pending_email", "", { path: "/", maxAge: 0 });
  } else {
    // No profile to bind a session to yet — carry the proven address into
    // onboarding so they don't retype it and can't change it.
    response.cookies.set("brewed_pending_email", result.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    // Whoever typed this code is the person at the keyboard now. If a member
    // was still signed in on this browser (a shared laptop, a demo), keeping
    // that session would hang the newcomer's password, profile and emails on
    // the old account — so the old session ends here.
    response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return response;
}
