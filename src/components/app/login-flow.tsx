"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { CoffeeCup, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The door decides which way you go:
 *
 *   new address        → verify by emailed code → set a password (required)
 *                        → onboarding
 *   existing account   → password sign-in ("email me a code" is the recovery
 *                        path, and it ends in setting a new password)
 *
 * Nobody reaches onboarding without a verified address AND a password.
 */
type Stage = "email" | "password" | "code" | "set-password";

export function LoginFlow({
  initialEmail = "",
  initialError = "",
}: {
  initialEmail?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<string | null>(null);
  const [mailBlocked, setMailBlocked] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [nextPath, setNextPath] = useState("/join");

  useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { res, data: await res.json() };
  };

  const requestCode = async () => {
    setBusy(true);
    setMailBlocked(null);
    try {
      const { res, data } = await post("/api/auth/request", { email });
      if (!res.ok) {
        // "restricted" means the provider refused this recipient (new-account
        // caps, unverified domain): nothing was sent, so the code screen
        // would have them waiting for mail that never left. Stay put.
        if (data.restricted) setMailBlocked(data.error);
        else toast.error(data.error ?? "Couldn't send a code.");
        return false;
      }
      setDevCode(data.devCode ?? null);
      setDelivery(data.delivery ?? null);
      setStage("code");
      return true;
    } catch {
      toast.error("Couldn't reach the server.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* --- stage: email — look the address up, then branch ---------------- */
  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { res, data } = await post("/api/auth/lookup", { email });
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't check that address.");
        return;
      }
      if (data.exists && data.hasPassword) {
        setIsNew(false);
        setStage("password");
      } else {
        // Brand new, or a pre-password account: both verify by code first.
        setIsNew(!data.exists);
        setBusy(false);
        await requestCode();
      }
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  /* --- stage: password (existing members) ----------------------------- */
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { res, data } = await post("/api/auth/login", { email, password });
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't sign you in.");
        return;
      }
      toast.success("Welcome back.");
      router.push(data.next);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  /* --- stage: code ----------------------------------------------------- */
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { res, data } = await post("/api/auth/verify", { email, code });
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't verify that code.");
        return;
      }
      setNextPath(data.enrolled ? "/dashboard" : "/join");
      toast.success("Email confirmed.");
      // Password is mandatory: new members set one, recovered members set a
      // new one. Nobody skips this screen.
      setStage("set-password");
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  /* --- stage: set-password (required) ---------------------------------- */
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { res, data } = await post("/api/auth/set-password", {
        password: newPassword,
      });
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save that password.");
        return;
      }
      toast.success("Password set.");
      router.push(nextPath);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <Link href="/" className="inline-block">
        <Logo />
      </Link>

      {mailBlocked && (
        <div className="sticker mt-6 rounded-xl bg-berry/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-berry">
            That email couldn&apos;t be delivered
          </p>
          <p className="mt-1 text-sm leading-relaxed text-bark">{mailBlocked}</p>
        </div>
      )}

      {stage === "email" && (
        <form onSubmit={submitEmail} className="mt-10">
          <CoffeeCup className="h-14 w-14" />
          <h1 className="headline font-display mt-5 text-5xl leading-none text-ink">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            Every chat happens over video and every update lands in your inbox
            — so use an email you actually read.
          </p>

          <div className="mt-7 flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-olive">
              Work or school email
            </Label>
            <Input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="sticker h-12 rounded-lg text-base focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            disabled={busy}
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-primary font-display text-xl tracking-wide text-primary-foreground hover:bg-primary"
          >
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Continue <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </form>
      )}

      {stage === "password" && (
        <form onSubmit={signIn} className="mt-10">
          <KeyRound className="h-14 w-14 text-roast" strokeWidth={1.6} />
          <h1 className="headline font-display mt-5 text-5xl leading-none text-ink">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            Signing in as <strong className="text-ink">{email}</strong>.
          </p>

          <div className="mt-7 flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-olive">
              Password
            </Label>
            <Input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="sticker h-12 rounded-lg text-base focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            disabled={busy || password.length === 0}
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-primary font-display text-xl tracking-wide text-primary-foreground hover:bg-primary disabled:opacity-45"
          >
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Sign in
          </Button>

          <button
            type="button"
            disabled={busy}
            onClick={requestCode}
            className="mt-4 w-full text-sm font-semibold text-olive hover:text-roast"
          >
            Forgot your password? Email me a code
          </button>

          <button
            type="button"
            onClick={() => {
              setStage("email");
              setPassword("");
              setMailBlocked(null);
            }}
            className="mt-2 w-full text-sm font-semibold text-olive hover:text-roast"
          >
            Use a different email
          </button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={verify} className="mt-10">
          <MailCheck className="h-14 w-14 text-roast" strokeWidth={1.6} />
          <h1 className="headline font-display mt-5 text-5xl leading-none text-ink">
            Check your email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            {isNew
              ? "New here — first, prove the address is yours."
              : "We'll verify it's you, then you'll set a new password."}{" "}
            We sent a six-digit code to <strong className="text-ink">{email}</strong>.
          </p>

          {devCode && (
            <div className="sticker mt-5 rounded-xl bg-primary/25 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-olive">
                No mail provider configured
              </p>
              <p className="mt-1 text-sm text-bark">
                Nothing was delivered. Your code is{" "}
                <strong className="font-display text-xl tracking-widest text-ink">
                  {devCode}
                </strong>
              </p>
            </div>
          )}
          {delivery && delivery !== "outbox" && (
            <p className="mt-3 text-xs text-olive">
              Sent via {delivery}. Nothing there? Check spam.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-olive">
              Six-digit code
            </Label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="sticker h-14 rounded-lg text-center font-display text-3xl tracking-[0.4em] focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            disabled={busy || code.length !== 6}
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-roast font-display text-xl tracking-wide text-[#191104] hover:bg-roast disabled:opacity-45"
          >
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Confirm
          </Button>

          <button
            type="button"
            onClick={() => {
              setStage("email");
              setCode("");
              setDevCode(null);
              setDelivery(null);
              setMailBlocked(null);
            }}
            className="mt-4 w-full text-sm font-semibold text-olive hover:text-roast"
          >
            Use a different email
          </button>
        </form>
      )}

      {stage === "set-password" && (
        <form onSubmit={savePassword} className="mt-10">
          <ShieldCheck className="h-14 w-14 text-matcha" strokeWidth={1.6} />
          <h1 className="headline font-display mt-5 text-5xl leading-none text-ink">
            {isNew ? "Set your password" : "Set a new password"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            {isNew
              ? "This is how you'll sign in from now on."
              : "Your old one stops working the moment you save this."}
          </p>

          <div className="mt-7 flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-olive">
              Password
            </Label>
            <Input
              type="password"
              autoFocus
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="at least 8 characters"
              className="sticker h-12 rounded-lg text-base focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            disabled={busy || newPassword.length < 8}
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-primary font-display text-xl tracking-wide text-primary-foreground hover:bg-primary disabled:opacity-45"
          >
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Save and continue
          </Button>
        </form>
      )}
    </div>
  );
}
