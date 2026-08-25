import { Eyebrow } from "@/components/brand";
import { PhoneMock } from "@/components/site/phone";
import { AvailabilityPreview, MatchCardPreview, TagCloudPreview } from "@/components/site/step-art";
import { ROUND_LABELS, sendsAtShort } from "@/lib/schedule";

const STEPS = [
  {
    n: "01",
    title: "Paste your LinkedIn, answer one question",
    body:
      "That's the whole signup. Whatever you can copy from your profile, and one question — what kind of people do you want to meet. No questionnaire, no tick-boxes, no bio to agonise over.",
    art: <TagCloudPreview />,
  },
  {
    n: "02",
    title: `We run the round ${ROUND_LABELS.closesDay} night`,
    body:
      "Every opted-in member goes into one pool. The matcher looks at all of it at once — not a feed you scroll — and finds the pairing that's best for both of you.",
    art: <MatchCardPreview />,
  },
  {
    n: "03",
    title: `${sendsAtShort}: one email`,
    body:
      "One person. Their headline, why the two of you, four things worth asking — and their email address. We hand you both the introduction and get out of the way.",
    art: (
      <PhoneMock
        title="Inbox"
        bubbles={[
          { from: "them", text: "☕ Your coffee chat: Priya Rao — Staff engineer @ Datadog." },
          { from: "them", text: "Why you two: she asked for help breaking into ML infra. You offered exactly that." },
          { from: "them", text: "priya.rao@datadog.com — she got your address too." },
          { from: "them", text: "You're both free Thu 2–5pm." },
        ]}
      />
    ),
  },
  {
    n: "04",
    title: "Have the chat, then tell us how it went",
    body:
      "Their booking link is in the email, so it's one click into their real calendar. Afterwards, rate it — that's what retunes your own matching for next week.",
    art: <AvailabilityPreview />,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b-2 border-ink bg-paper py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-5xl leading-none text-ink sm:text-6xl">
            {STEPS.length} steps. One conversation.
          </h2>
        </div>

        <div className="mt-14 flex flex-col gap-14">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`flex flex-col items-center gap-8 md:flex-row md:gap-14 ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1">
                <span className="sticker inline-grid h-12 w-12 place-items-center rounded-full bg-primary font-display text-2xl text-ink">
                  {step.n}
                </span>
                <h3 className="mt-4 font-display text-3xl leading-tight text-ink sm:text-4xl">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-bark">
                  {step.body}
                </p>
              </div>
              <div className="flex flex-1 justify-center">{step.art}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
