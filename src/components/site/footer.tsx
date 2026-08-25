import Link from "next/link";
import { Logo } from "@/components/brand";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "The matchmaker", href: "/#matchmaker" },
      { label: "Matching lab", href: "/lab" },
      { label: "Outbox", href: "/outbox" },
      { label: "Your match", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Coffee chat guide", href: "/#faq" },
      { label: "Questions to ask", href: "/#faq" },
      { label: "Manifesto", href: "/#matchmaker" },
      { label: "Careers", href: "/#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/#" },
      { label: "Privacy", href: "/#" },
      { label: "Cookies", href: "/#" },
      { label: "Safety", href: "/#trust" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-espresso py-14 text-paper">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo className="[&_span]:text-paper" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-clay">
              One good conversation a week, with someone who actually wanted to
              have it.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-display text-lg uppercase tracking-[0.18em] text-primary">
                {col.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-clay transition-colors hover:text-paper"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-clay/25 pt-6 sm:flex-row">
          <p className="text-xs text-clay">
            © {new Date().getFullYear()} Brewed. Not affiliated with anyone
            you&apos;ve heard of.
          </p>
          <p className="font-script text-lg text-primary">
            go talk to someone ☕
          </p>
        </div>
      </div>
    </footer>
  );
}
