import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JoinFlow } from "@/components/app/join-flow";
import { getRoundNumber } from "@/lib/store";
import { SESSION_COOKIE, readSession } from "@/lib/auth";
import { LINKEDIN_PENDING_COOKIE } from "@/lib/linkedin";
import { getProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join a round | Brewed",
};

export default async function JoinPage() {
  // Onboarding is only reachable with a proven email — either an existing
  // session (editing answers) or a code verified moments ago.
  const jar = await cookies();
  const sessionId = readSession(jar.get(SESSION_COOKIE)?.value);
  const sessionEmail = sessionId ? (await getProfile(sessionId))?.email : undefined;
  const pending = jar.get("brewed_pending_email")?.value;
  const email = sessionEmail ?? pending;

  if (!email) redirect("/login");

  // Set when they arrived through LinkedIn; used to greet them by name and to
  // skip asking for what LinkedIn already proved.
  let linkedinName = "";
  try {
    const raw = jar.get(LINKEDIN_PENDING_COOKIE)?.value;
    if (raw) linkedinName = (JSON.parse(raw) as { name?: string }).name ?? "";
  } catch {
    // A malformed cookie just means no greeting.
  }

  return (
    <main className="paper-grain min-h-screen">
      <JoinFlow
        verifiedEmail={email}
        roundNumber={await getRoundNumber()}
        linkedinName={linkedinName}
      />
    </main>
  );
}
