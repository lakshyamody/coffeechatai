import { Avatar } from "@/components/brand";
import { cn } from "@/lib/utils";

interface Bubble {
  from: "them" | "you";
  text: string;
}

export function PhoneMock({
  title = "Crashh",
  bubbles,
  className,
}: {
  title?: string;
  bubbles: Bubble[];
  className?: string;
}) {
  // The people in these mockups are invented to show the format. Saying so
  // on the component keeps every use of it honest by default.
  return (
    <div
      className={cn(
        "sticker-lg w-full max-w-[19rem] overflow-hidden rounded-[2rem] p-2",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-paper">
        <div className="flex items-center gap-2 border-b-2 border-ink bg-cream px-3 py-2">
          <Avatar name={title} seed={2} className="h-7 w-7 text-[0.6rem]" />
          <span className="font-display text-lg tracking-wide text-ink">{title}</span>
          <span className="ml-auto rounded-full border border-olive/40 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-olive">
            example
          </span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {bubbles.map((b, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-[0.8rem] leading-snug",
                b.from === "them"
                  ? "self-start rounded-bl-md bg-white text-black shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                  : "self-end rounded-br-md bg-sky text-white",
              )}
            >
              {b.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
