"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OptInButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const optIn = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optedIn: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("You're back in the next round.");
      router.refresh();
    } catch {
      toast.error("Couldn't update. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={optIn}
      disabled={busy}
      className="sticker sticker-press h-12 rounded-xl bg-primary px-7 font-display text-xl tracking-wide text-primary-foreground hover:bg-primary"
    >
      Put me back in
    </Button>
  );
}
