import Link from "next/link";
import { Button } from "@/components/ui/button";
import { liveStats } from "@/lib/store";

/**
 * Live figures, read out of the database at request time.
 *
 * There are no invented numbers and no testimonials here. Until real chats
 * have happened there is nothing to claim, and the section says so rather
 * than filling the space with something flattering.
 */
export async function Proof() {
  const stats = await liveStats();
  const early = stats.chatsArranged === 0;

  const figures = [
    { value: stats.members.toLocaleString(), label: stats.members === 1 ? "person in the pool" : "people in the pool" },
    { value: stats.chatsArranged.toLocaleString(), label: "chats arranged" },
    { value: stats.roundsClosed.toLocaleString(), label: stats.roundsClosed === 1 ? "round run" : "rounds run" },
    {
      value: stats.averageRating === null ? "—" : stats.averageRating.toFixed(1),
      label: stats.ratedChats === 0 ? "no ratings yet" : `average of ${stats.ratedChats} rating${stats.ratedChats === 1 ? "" : "s"}`,
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-roast">
            Where things actually stand
          </p>
          <h2 className="headline mt-3 font-display text-5xl leading-none lowercase text-ink sm:text-6xl">
            {early ? "Nothing to brag about yet" : "Read straight off the database"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-bark">
            {early ? (
              <>
                No chats have happened, so there are no numbers worth quoting and
                no testimonials to print. These figures are read live, and
                they&apos;ll move the moment real people start meeting.
              </>
            ) : (
              <>
                Every figure here is counted from what has actually happened —
                no rounded-up vanity metrics, no invented quotes.
              </>
            )}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((s) => (
            <div key={s.label} className="sticker-lg rounded-2xl p-6 text-center">
              <p className="font-display text-5xl leading-none text-roast">{s.value}</p>
              <p className="mt-2 text-sm font-semibold text-bark">{s.label}</p>
            </div>
          ))}
        </div>

        {early && (
          <div className="sticker-lg mx-auto mt-6 max-w-2xl rounded-2xl p-6 text-center">
            <p className="font-display text-2xl leading-tight tracking-wide text-ink">
              {stats.members === 0
                ? "Be the first person in the pool"
                : stats.members < 6
                  ? `${stats.members} ${stats.members === 1 ? "person has" : "people have"} joined — a few more and rounds start producing matches`
                  : `${stats.members} people are in. The next round will pair them.`}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-bark">
              A matching pool is only as good as who&apos;s in it. Send this to one
              person you&apos;d genuinely want across the table.
            </p>
            <Button
              asChild
              className="sticker sticker-press mt-5 h-11 rounded-lg bg-primary px-6 font-display text-lg tracking-wide text-ink hover:bg-primary"
            >
              <Link href="/login">Join the pool</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
