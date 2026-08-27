import { Building2, EyeOff, ShieldCheck } from "lucide-react";
import { FadeUp } from "@/components/site/fx";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "verified humans only",
    body: "Every member joins with a work or school email and we check it. No anonymous accounts, no recruiters in disguise, no bots farming your inbox.",
  },
  {
    icon: EyeOff,
    title: "only your match sees you",
    body: "There's no directory to browse and no profile to be found in search. The one person you're matched with each week sees your details — nobody else, ever.",
  },
  {
    icon: Building2,
    title: "video calls, on your terms",
    body: "Every chat is a video call booked through your own link — nobody gets your address, your office, or your phone number. Block a company or a person and they're gone.",
  },
];

export function Trust() {
  return (
    <div id="trust" className="mx-auto max-w-6xl px-6 py-20">
      <FadeUp className="text-center">
        <h2 className="headline font-display text-[36px] leading-[1.05] tracking-tight text-white md:text-[52px]">
          verified. private. <em className="italic">safe.</em>
        </h2>
      </FadeUp>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {ITEMS.map((item, i) => (
          <FadeUp key={item.title} delay={0.08 * i}>
            <div className="sticker-lg h-full p-6">
              <span className="glass-pill h-12 w-12 rounded-xl">
                <item.icon className="h-6 w-6 text-roast" strokeWidth={2} />
              </span>
              <h3 className="headline font-display mt-4 text-[24px] leading-tight tracking-tight text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{item.body}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}
