import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/brand";

export function OperatorLocked({
  what,
  configured,
}: {
  what: string;
  configured: boolean;
}) {
  return (
    <main className="paper-grain grid min-h-screen place-items-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <Lock className="mx-auto mt-8 h-12 w-12 text-olive" strokeWidth={1.6} />
        <h1 className="mt-5 font-display text-4xl leading-none text-ink">
          The {what} is operator-only
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bark">
          It shows real members and the mail sent to them, so it isn&apos;t
          public.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-olive">
          {configured ? (
            <>
              Append <code className="rounded bg-sand px-1">?key=…</code> with the
              value of <code className="rounded bg-sand px-1">BREWED_ADMIN_TOKEN</code>.
            </>
          ) : (
            <>
              No <code className="rounded bg-sand px-1">BREWED_ADMIN_TOKEN</code> is
              set, so there is no way in. Set one and redeploy.
            </>
          )}
        </p>
      </div>
    </main>
  );
}
