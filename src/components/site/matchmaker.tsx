import { FadeUp, Roman } from "@/components/site/fx";
import { providerLabel } from "@/lib/extractor";
import { WEIGHTS } from "@/lib/scoring";

// Read from the same constants the matcher uses. These footnotes used to be
// hand-written, and the provider one had already drifted — the page claimed
// one model while another did the work.
const RECIPROCITY_PCT = Math.round(WEIGHTS.reciprocity * 100);

export function Matchmaker() {
  const columns = [
    {
      roman: "I",
      tilt: "-8deg",
      title: ["reads you, not", "your checkboxes"],
      body: `You paste your LinkedIn and answer one question. A model turns that into everything the matcher needs — and you see exactly what it extracted.`,
      footnote: `${providerLabel()} · falls back to rules if the call fails`,
    },
    {
      roman: "II",
      tilt: "6deg",
      title: ["scores both", "directions"],
      body: `Your offers against their asks, and theirs against yours — blended so a balanced pair beats a one-sided one, without dismissing a genuine one-way fit.`,
      footnote: `${RECIPROCITY_PCT}% of the score, the largest single term`,
    },
    {
      roman: "III",
      tilt: "-11deg",
      title: ["solves the whole", "round at once"],
      body: `Everyone sits in one pool, so this is the stable roommates problem. Irving's algorithm finds a pairing where no two people would both rather have had each other.`,
      footnote: "Irving (1985), Journal of Algorithms 6(4)",
    },
    {
      roman: "IV",
      tilt: "9deg",
      title: ["learns from every", "chat you rate"],
      body: `We know exactly why we paired you, so your rating is a labelled example. Your own scoring weights drift toward whatever actually worked for you.`,
      footnote: "multiplicative weights, per member",
    },
  ];

  return (
    <div
      id="matchmaker"
      className="flex min-h-screen w-full items-start justify-center px-6 pb-[60px] pt-[60px] md:pt-[80px] 2xl:pt-[100px]"
    >
      <FadeUp className="relative flex w-full max-w-6xl flex-col items-center px-4 2xl:max-w-7xl">
        <h2 className="headline font-display mt-2 text-center text-[36px] leading-[1.05] tracking-tight text-white md:text-[48px] 2xl:text-[56px]">
          <span className="block">your personalized</span>
          <span className="block">matchmaker</span>
        </h2>
        <p className="mt-4 max-w-xl text-center text-sm leading-relaxed text-white/70">
          Every number behind your match is visible to you. Here&apos;s what
          it&apos;s actually doing.
        </p>

        <div className="mt-12 grid w-full grid-cols-1 items-start gap-10 md:mt-16 md:grid-cols-2 md:gap-x-8 md:gap-y-14 xl:grid-cols-4">
          {columns.map((col) => (
            <div key={col.roman} className="relative flex flex-col items-center">
              <h3 className="headline font-display relative inline-block text-center text-[24px] leading-[1.1] tracking-tight text-white md:text-[26px] 2xl:text-[30px]">
                <Roman numeral={col.roman} tilt={col.tilt} />
                {col.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h3>
              <p className="mt-3 max-w-[300px] text-center text-[13px] leading-relaxed text-white/75">
                {col.body}
              </p>
              <p className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-wider text-roast">
                {col.footnote}
              </p>
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}
