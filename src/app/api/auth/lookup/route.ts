import { NextResponse } from "next/server";
import { isEmail, normaliseEmail } from "@/lib/auth";
import { getProfileByEmail } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Which door does this address go through?
 *
 * Existing members sign in with their password; new addresses verify first.
 * This does reveal whether an address has an account — that's inherent to
 * branching the flow on it, and it's the trade the product chose.
 */
export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }
  const email = normaliseEmail(body.email ?? "");
  if (!isEmail(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 422 });
  }
  const profile = await getProfileByEmail(email);
  return NextResponse.json({
    exists: Boolean(profile),
    // An account created before passwords were mandatory still signs in by
    // code, then sets one.
    hasPassword: Boolean(profile?.passwordHash),
  });
}
