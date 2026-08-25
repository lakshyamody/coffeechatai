import { NextResponse } from "next/server";
import { createChallenge, isEmail } from "@/lib/auth";
import { sendEmail, verificationEmail, emailConfigured } from "@/lib/email";
import { getProfileByEmail } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 422 });
  }

  const { email: normalised, code } = await createChallenge(email);
  const template = verificationEmail(code);
  const sent = await sendEmail({ to: normalised, ...template });

  // A code nobody can read is a dead end. Say so here rather than leaving
  // someone staring at an empty inbox and an code box.
  if (sent.error) {
    // Some providers refuse recipients outside a verified domain. Worth
    // naming precisely, because the fix is configuration rather than retrying.
    const restricted = /only send testing emails|verify a domain|not verified/i.test(
      sent.error,
    );
    return NextResponse.json(
      {
        error: restricted
          ? "We can't email this address yet. The sending domain isn't verified, so mail only reaches the provider account owner."
          : "We couldn't send that email.",
        detail: sent.error,
        restricted,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: normalised,
    /** Whether this address already has a profile — decides where to land them. */
    returning: Boolean(await getProfileByEmail(normalised)),
    delivery: sent.transport,
    deliveryError: sent.error ?? null,
    /**
     * With no mail provider configured the code can't reach an inbox, so it
     * comes back here instead. Never exposed once a provider is configured.
     */
    devCode: emailConfigured() ? undefined : code,
  });
}
