import Link from "next/link";
import { Mail, MailX } from "lucide-react";
import { Eyebrow, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { emailConfigured, outbox } from "@/lib/email";

export const dynamic = "force-dynamic";
export const metadata = { title: "Outbox | Brewed" };

/**
 * Every message the app has produced this run.
 *
 * With RESEND_API_KEY set these were really delivered and this is a log;
 * without it nothing left the machine and this is the only place to read
 * them — which is what makes the whole email flow demoable with no setup.
 */
export default async function OutboxPage() {
  const messages = await outbox();
  const live = emailConfigured();

  return (
    <main className="paper-grain min-h-screen pb-20">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-8">
        <Link href="/">
          <Logo />
        </Link>
        <Button asChild variant="ghost" className="font-semibold text-bark hover:bg-sand">
          <Link href="/dashboard">Your match</Link>
        </Button>
      </div>

      <div className="mx-auto max-w-3xl px-5">
        <div className="mt-10">
          <Eyebrow>Outbox</Eyebrow>
          <h1 className="mt-2 font-display text-5xl leading-none text-ink">
            Everything we&apos;ve sent
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-bark">
            {live ? (
              <>
                Resend is configured, so these went out for real. Note that
                Resend&apos;s shared sender only delivers to the address that owns
                the account until you verify a domain.
              </>
            ) : (
              <>
                No <code className="rounded bg-sand px-1">RESEND_API_KEY</code> is
                set, so nothing left this machine. Verification codes, welcome
                notes, and match emails all land here instead.
              </>
            )}
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="sticker mt-8 flex items-center gap-3 rounded-xl p-6">
            <MailX className="h-6 w-6 text-olive" />
            <p className="text-sm text-bark">
              Nothing yet. Sign in or join a round and the mail shows up here.
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {messages.map((m) => (
              <article key={m.id} className="sticker-lg overflow-hidden rounded-2xl">
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-ink bg-cream px-5 py-3">
                  <Mail className="h-4 w-4 shrink-0 text-roast" />
                  <span className="font-display text-lg leading-tight tracking-wide text-ink">
                    {m.subject}
                  </span>
                  <span className="text-xs font-semibold text-olive">to {m.to}</span>
                  <span
                    className={`ml-auto rounded-full border-2 border-ink px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                      m.error ? "bg-berry text-white" : m.transport === "resend" ? "bg-matcha text-white" : "bg-primary text-ink"
                    }`}
                  >
                    {m.error ? "failed" : m.transport === "resend" ? "delivered" : "captured"}
                  </span>
                </header>
                {m.error && (
                  <p className="border-b-2 border-ink bg-berry/10 px-5 py-2 text-xs font-semibold text-berry">
                    {m.error}
                  </p>
                )}
                {/*
                  Rendered in a sandboxed iframe rather than injected: these
                  are complete HTML documents, and nesting <html> inside a div
                  is invalid markup that the browser silently restructures —
                  which desynchronises hydration. The iframe also keeps email
                  CSS from leaking into the app.
                */}
                <iframe
                  title={m.subject}
                  srcDoc={m.html}
                  sandbox=""
                  loading="lazy"
                  className="block h-[26rem] w-full border-0 bg-white"
                />
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
