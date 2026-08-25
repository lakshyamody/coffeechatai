import { Eyebrow } from "@/components/brand";
import { ROUND_LABELS, closesAt } from "@/lib/schedule";
import { SCORE_TERMS } from "@/lib/scoring";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = [
  {
    q: "How does the pairing actually work?",
    a: `${ROUND_LABELS.closesDay} at midnight everyone who's opted in goes into one pool. We score every viable pair on ${SCORE_TERMS.length} things — whether you each have what the other asked for, how much context you share, whether the seniority gap is the one you wanted, whether your calendars overlap, whether your values and personalities fit, and whether you're different enough to learn something. Then we solve for the arrangement that's best across the whole round, not just best for whoever signed up first.`,
  },
  {
    q: "How do I sign in?",
    a: `With your email and a six-digit code. Everything else runs through that address too: the confirmation when you join, your match every ${ROUND_LABELS.sendsDay}, and the note asking how it went. Use an inbox you actually read. You can also set a password afterwards so signing back in doesn't need the inbox at all.`,
  },
  {
    q: "Why do I have to paste my LinkedIn instead of connecting it?",
    a: "Because connecting it wouldn't help. LinkedIn's public API returns your name, photo and email — and nothing else. No headline, no employer, no history. Reading an actual profile requires their partner programme, which isn't self-serve. So pasting is the honest way to get the substance we match on, and it takes about ten seconds.",
  },
  {
    q: "Do you give out my email address?",
    a: `To exactly one person a week: the person you're matched with, who gets it at the same moment you get theirs. Nobody else can see it, there's no directory, and there's no way to browse for you. If you'd rather not be reachable that week, opt out before ${ROUND_LABELS.closesDay}.`,
  },
  {
    q: "What does the AI actually do?",
    a: "It reads what you pasted from LinkedIn and your answer about who you want to meet, and turns them into everything the matcher needs — what you can offer, what you're after, the subjects you know, how senior the other person should be, and what you won't put up with. That's what gets matched on. It doesn't pick your match: the pairing itself is a deterministic algorithm over scores you can see. And it never sees more of you than what you gave it.",
  },
  {
    q: "What's a hard no?",
    a: "A deal-breaker you tick during signup — no recruiters, no sales pitches, no colleagues from your own company, and a few others. These aren't weighted down, they're enforced: anyone matching one is deleted from your candidate pool before scoring even runs. Every box you tick makes your pool smaller, so tick only what you mean.",
  },
  {
    q: "Does it get better the more I use it?",
    a: "Yes, and specifically because you rate your chats. We know exactly why we paired you, so a rating tells us which parts of that reasoning were worth anything to you. After a handful of chats your own weights can look quite different from the defaults — someone who keeps rating chemistry highly gets matched on it more heavily than someone who only cares about a useful calendar.",
  },
  {
    q: "Why didn't I get my top match?",
    a: "Because the matcher optimises the round, not your row. If pairing you with your first choice would have left two other people with nobody good, it won't do it. We aim for a stable arrangement — one where no two people would both rather have had each other than what they got.",
  },
  {
    q: "What do I find out before the chat?",
    a: "Their name, headline, city, email address, what they offered and asked for, the score breakdown, and four conversation starters drawn from your actual overlap. No photo — we found it changed who people said yes to, for reasons that had nothing to do with the conversation.",
  },
  {
    q: "Can I skip a week?",
    a: `Yes. Opt out any time before ${closesAt} and you're simply not in that round. No streak to break, no penalty, and you're back the moment you opt in again.`,
  },
  {
    q: "What if I don't want to meet someone again?",
    a: "Block them and you'll never be matched again, in either direction. You can also block an entire company — useful if you'd rather not be paired with your own colleagues or a competitor.",
  },
  {
    q: "I'm in-person only and got nothing. Why?",
    a: "You can only meet people in your city, and if there aren't enough members there yet, we'd rather tell you than invent a bad match. Switch to video, or stay in-person and we'll match you the week the density is there.",
  },
  {
    q: "Is this a job board?",
    a: "No. Some people are hiring and some are looking, and they say so up front, which is why those pairings work. But most rounds are people swapping notes with someone one step ahead or one step behind them.",
  },
  {
    q: "Who can see my answers?",
    a: "The matcher, and the one person you're matched with each week — and they only see what you chose to put on your offers and asks. There is no browsable directory. Your availability grid is never shown, only the overlap.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-b-2 border-ink bg-paper py-20">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-3 font-display text-5xl leading-none text-ink sm:text-6xl">
            Sometimes our lines are busy
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 flex flex-col gap-3">
          {QUESTIONS.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`q${i}`}
              className="sticker rounded-xl border-b-2 px-5"
            >
              <AccordionTrigger className="py-4 text-left font-display text-xl leading-tight tracking-wide text-ink hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-bark">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
