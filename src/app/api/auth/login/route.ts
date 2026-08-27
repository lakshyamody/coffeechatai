import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  isEmail,
  issueSession,
  normaliseEmail,
  verifyPassword,
} from "@/lib/auth";
import { getProfileByEmail } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const email = normaliseEmail(body.email ?? "");
  const password = body.password ?? "";
  if (!isEmail(email) || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 422 });
  }

  const profile = await getProfileByEmail(email);
  const ok = await verifyPassword(password, profile?.passwordHash);

  // One message for "no such account", "no password set", and "wrong
  // password" — anything more specific tells a stranger which emails are
  // registered here.
  if (!profile || !ok) {
    return NextResponse.json(
      { error: "That email and password don't match. You can sign in with a code instead." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, next: "/dashboard" });
  response.cookies.set(SESSION_COOKIE, issueSession(profile.id), SESSION_COOKIE_OPTIONS);
  // Signing in is as explicit as verifying a code: any half-finished signup
  // for a different address on this browser is over.
  response.cookies.set("brewed_pending_email", "", { path: "/", maxAge: 0 });
  return response;
}
