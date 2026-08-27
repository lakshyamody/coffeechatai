import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JoinFlow } from "@/components/app/join-flow";
import { getRoundNumber } from "@/lib/store";
import { SESSION_COOKIE, readSession } from "@/lib/auth";
import { LINKEDIN_PENDING_COOKIE, linkedinConfigured } from "@/lib/linkedin";
import { getProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join a round | Crashh",
};

export default async function JoinPage() {
  // Onboarding is only reachable with a proven email — either an existing
  // session (editing answers) or a code verified moments ago.
  const jar = await cookies();
  const sessionId = readSession(jar.get(SESSION_COOKIE)?.value);
  const sessionEmail = sessionId ? (await getProfile(sessionId))?.email : undefined;
  const pending = jar.get("brewed_pending_email")?.value;
  // A just-verified address outranks an older session: on a shared browser
  // the flow belongs to whoever typed the last code.
  const email = pending ?? sessionEmail;

  if (!email) redirect("/login");

  // Set when they arrived through LinkedIn; used to greet them by name and to
  // skip asking for what LinkedIn already proved.
  let linkedin: { name?: string; picture?: string; email?: string } | null = null;
  try {
    const raw = jar.get(LINKEDIN_PENDING_COOKIE)?.value;
    if (raw) linkedin = JSON.parse(raw) as { name?: string; picture?: string; email?: string };
  } catch {
    // A malformed cookie just means they haven't connected yet.
  }

  return (
    <main className="paper-grain min-h-screen">
      <JoinFlow
        verifiedEmail={email}
        roundNumber={await getRoundNumber()}
        linkedin={linkedin}
        linkedinEnabled={linkedinConfigured()}
      />
    </main>
  );
}
