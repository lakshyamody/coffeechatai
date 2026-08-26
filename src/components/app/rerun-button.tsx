"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendsAtShort } from "@/lib/schedule";

export function RoundControls() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <RerunButton />
      <NotifyButton />
      <CloseRoundButton />
    </div>
  );
}

export function NotifyButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const notify = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/round/notify", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(
        `${data.sent} match emails sent across ${data.pairings} pairings.` +
          (data.failures?.length ? ` ${data.failures.length} failed.` : ""),
      );
      router.refresh();
    } catch {
      toast.error("Couldn't send the round.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={notify}
      disabled={busy}
      className="sticker sticker-press h-11 rounded-lg bg-roast px-5 font-display text-lg tracking-wide text-[#191104] hover:bg-roast"
    >
      <Send className={`mr-2 h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
      Send the {sendsAtShort} emails
    </Button>
  );
}

export function CloseRoundButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const close = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/round/commit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(
        `${data.recorded} chats recorded. Round ${data.roundNumber} is open — those pairs can't come up again.`,
      );
      router.refresh();
    } catch {
      toast.error("Couldn't close the round.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={close}
      disabled={busy}
      variant="ghost"
      className="sticker sticker-press h-11 rounded-lg px-5 font-display text-lg tracking-wide text-ink"
    >
      <Archive className="mr-2 h-4 w-4" />
      Close round &amp; open the next
    </Button>
  );
}

export function RerunButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const rerun = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/round", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(
        `Re-solved in ${data.stats.elapsedMs}ms via ${data.strategy.replace(/-/g, " ")}.`,
      );
      router.refresh();
    } catch {
      toast.error("Couldn't re-run the round.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={rerun}
      disabled={busy}
      className="sticker sticker-press h-11 rounded-lg bg-primary px-5 font-display text-lg tracking-wide text-primary-foreground hover:bg-primary"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      Re-run the round
    </Button>
  );
}
