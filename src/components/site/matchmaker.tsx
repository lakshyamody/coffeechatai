import { ArrowLeftRight, Repeat, ScanLine, Sigma } from "lucide-react";
import { Eyebrow } from "@/components/brand";
import { providerLabel } from "@/lib/extractor";
import { WEIGHTS } from "@/lib/scoring";

// Read from the same constants the matcher uses. These footnotes used to be
// hand-written, and the provider one had already drifted — the page claimed
// Claude while Gemini was doing the work.
const RECIPROCITY_PCT = Math.round(WEIGHTS.reciprocity * 100);

const PILLARS = [
  {
    icon: ScanLine,
    title: "We read you, not your checkboxes",
    body:
      "You write a few sentences in your own words. A language model turns that into a structured profile — your values, how you like to talk, what a good outcome looks like, what you won't tolerate — and the matcher reasons over that instead of keywords. You see exactly what it extracted, and you can correct it.",
    footnote: `${providerLabel()} · falls back to rules if the call fails`,
  },
  {
    icon: ArrowLeftRight,
    title: "It scores both directions",
    body:
      "A chat where one person gets everything and the other gets nothing is a bad chat, however well it reads on paper. Your offers are matched against their asks and theirs against yours, then blended so a balanced pair beats a one-sided one — without dismissing a genuine one-way fit, which is what a student asking an engineer about their path actually is.",
    footnote: `${RECIPROCITY_PCT}% of the score, the largest single term`,
  },
  {
    icon: Sigma,
    title: "It solves the whole round at once",
    body:
      "Everyone sits in one pool, so this is the stable roommates problem — not swiping, and not the bipartite matching a dating app uses. Irving's algorithm finds a pairing where no two people would both rather have had each other. When no stable solution exists we say so, and maximise total quality instead.",
    footnote: "Irving (1985), Journal of Algorithms 6(4)",
  },
  {
    icon: Repeat,
    title: "It learns from every chat you rate",
    body:
      "We know exactly why we paired you, so your rating is a labelled example. A multiplicative-weights update shifts your personal scoring weights toward whatever actually worked — if chemistry matters more to you than a shared calendar, your weights say so within a few rounds. Your weights rank your matches; the number you both see stays the same.",
    footnote: "Hedge / exponentiated gradient, per member",
  },
];

export function Matchmaker() {
  return (
    <section id="matchmaker" className="border-b-2 border-ink bg-espresso py-20 text-paper">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <Eyebrow className="text-primary">Your matchmaker</Eyebrow>
          <h2 className="mt-3 font-display text-5xl leading-none text-paper sm:text-6xl">
            Not an algorithm that guesses
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-clay">
            Questionnaire and free text in, a structured profile out, one
            global solve, then it learns from what you tell it. Every number is
            visible to you.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border-2 border-clay/40 bg-bark/40 p-6"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-primary">
                <p.icon className="h-6 w-6 text-ink" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 font-display text-2xl leading-tight tracking-wide text-paper">
                {p.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-clay">{p.body}</p>
              <p className="mt-4 border-t border-clay/25 pt-3 font-mono text-[0.7rem] uppercase tracking-wider text-primary/80">
                {p.footnote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
