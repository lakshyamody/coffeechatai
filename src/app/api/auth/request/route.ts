import { NextResponse } from "next/server";
import { createChallenge, isEmail } from "@/lib/auth";
import {
  emailConfigured,
  explainDeliveryError,
  sendEmail,
  verificationEmail,
} from "@/lib/email";
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
    const problem = explainDeliveryError(sent.error);
    return NextResponse.json(
      { error: problem.message, detail: sent.error, restricted: problem.blocked },
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
