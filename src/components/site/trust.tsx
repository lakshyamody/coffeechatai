import { Building2, EyeOff, ShieldCheck } from "lucide-react";
import { Eyebrow } from "@/components/brand";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Verified humans only",
    body:
      "Every member joins with a work or school email and we check it. No anonymous accounts, no recruiters in disguise, no bots farming your inbox.",
  },
  {
    icon: EyeOff,
    title: "Only your match sees you",
    body:
      "There's no directory to browse and no profile to be found in search. The one person you're matched with each week sees your details — nobody else, ever.",
  },
  {
    icon: Building2,
    title: "Public places, or video",
    body:
      "In-person chats are cafés and lobbies, never homes. Prefer video? Say so once and we'll never suggest anything else. Block a company or a person and they're gone.",
  },
];

export function Trust() {
  return (
    <section id="trust" className="border-b-2 border-ink bg-cream py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <Eyebrow>Verified. Private. Safe.</Eyebrow>
          <h2 className="mt-3 font-display text-5xl leading-none text-ink sm:text-6xl">
            Networking without the exposure
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {ITEMS.map((item) => (
            <div key={item.title} className="sticker-lg rounded-2xl p-6">
              <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-matcha">
                <item.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 font-display text-2xl leading-tight tracking-wide text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-bark">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
