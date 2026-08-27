import Link from "next/link";

const RESOURCES = [
  { label: "How it works", href: "/#how" },
  { label: "The matchmaker", href: "/#matchmaker" },
  { label: "FAQ", href: "/#faq" },
  { label: "Your match", href: "/dashboard" },
];

export function SiteFooter() {
  return (
    <footer className="relative w-full bg-espresso px-6 pb-6 pt-12 md:px-12 md:pb-8 md:pt-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-10 md:flex-row">
        <div className="flex flex-col">
          {/* the crashh speech bubble */}
          <div className="relative inline-flex w-fit max-w-[300px] rounded-[18px] rounded-bl-[4px] bg-white px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            <p className="text-[14px] font-medium leading-[1.25] tracking-tight text-black md:text-[15px]">
              A friend that emails you one person worth meeting.
            </p>
            <span
              aria-hidden
              className="absolute -bottom-[5px] left-[12px] h-3 w-3 rotate-45 bg-white"
            />
          </div>

          <div className="mt-4">
            <span className="font-display text-[40px] font-bold leading-none tracking-tight text-white md:text-[48px]">
              crashh
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <h3 className="text-[13px] font-medium text-white/40">Resources</h3>
          <nav className="mt-4 flex flex-col items-start gap-3 md:items-end">
            {RESOURCES.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[14px] text-white transition-colors hover:text-white/70"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] text-white md:mt-auto md:pt-10">
            <span className="text-white/70">
              © Crashh {new Date().getFullYear()}
            </span>
            <span className="font-script text-lg text-roast">
              go talk to someone ☕
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
