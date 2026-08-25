import { NextResponse } from "next/server";
import {
  LINKEDIN_STATE_COOKIE,
  authorizeUrl,
  issueState,
  linkedinConfigured,
} from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!linkedinConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=linkedin-not-configured`);
  }
  const state = issueState();
  const response = NextResponse.redirect(authorizeUrl(origin, state));
  response.cookies.set(LINKEDIN_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
