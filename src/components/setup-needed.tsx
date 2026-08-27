import { CoffeeCup } from "@/components/brand";
import { SiteBackdrop } from "@/components/site/background-video";

/**
 * Shown in place of the whole app when storage is unreachable. Crashh stores
 * real accounts, so running without a database would mean silently losing
 * people's signups — better to stop and say what's missing.
 */
export function SetupNeeded() {
  return (
    <main className="paper-grain grid min-h-screen place-items-center px-5 py-16">
      <SiteBackdrop />
      <div className="w-full max-w-xl">
        <CoffeeCup className="h-14 w-14" />
        <h1 className="mt-5 font-display text-5xl leading-none text-ink">
          Almost there — this needs a database
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bark">
          Crashh stores real accounts and real matches, so it needs somewhere
          durable to put them. Locally that&apos;s a SQLite file; this host has a
          read-only filesystem, so it needs Postgres.
        </p>

        <ol className="sticker mt-7 flex list-decimal flex-col gap-3 rounded-xl p-6 pl-10 text-sm leading-relaxed text-bark">
          <li>
            In the Vercel dashboard, open{" "}
            <strong className="text-ink">Storage</strong> and create a{" "}
            <strong className="text-ink">Neon Postgres</strong> database. You&apos;ll
            be asked to accept the marketplace terms once.
          </li>
          <li>
            Connect it to this project. That sets{" "}
            <code className="rounded bg-sand px-1">POSTGRES_URL</code> for you.
          </li>
          <li>Redeploy. Tables are created automatically on first boot.</li>
        </ol>

        <p className="mt-5 text-sm leading-relaxed text-olive">
          Any Postgres will do — Neon, Supabase, RDS. Set{" "}
          <code className="rounded bg-sand px-1">POSTGRES_URL</code> or{" "}
          <code className="rounded bg-sand px-1">DATABASE_URL</code> and this screen
          goes away.
        </p>
      </div>
    </main>
  );
}
