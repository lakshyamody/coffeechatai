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
  const [nextPath, setNextPath] = useState("/dashboard");

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

  /* --- password sign-in --------------------------------------------- */
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

  /* --- email a code -------------------------------------------------- */
  const requestCode = async () => {
    setBusy(true);
    setMailBlocked(null);
    try {
      const { res, data } = await post("/api/auth/request", { email });
      if (!res.ok) {
        // Most likely the sending domain isn't verified yet, which is a
        // configuration fact, not something the visitor did wrong.
        if (data.restricted) setMailBlocked(data.error);
        else toast.error(data.error ?? "Couldn't send a code.");
        setStage("code");
        return;
      }
      setDevCode(data.devCode ?? null);
      setDelivery(data.delivery ?? null);
      setStage("code");
      toast.success(
        data.delivery === "outbox" ? "Code generated." : `Code sent to ${data.email}.`,
      );
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  /* --- verify code --------------------------------------------------- */
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { res, data } = await post("/api/auth/verify", { email, code });
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't verify that code.");
        return;
      }
      setNextPath(data.next);
      toast.success(data.enrolled ? "Welcome back." : "Email confirmed.");
      if (data.enrolled) {
        // Existing member: there's an account to attach a password to, so
        // offer it now.
        setStage("set-password");
      } else {
        // Brand new: no profile exists yet, so there is nothing to hang a
        // password on. The offer moves to the end of onboarding.
        router.push(data.next);
        router.refresh();
      }
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  /* --- set a password ------------------------------------------------ */
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { res, data } = await post("/api/auth/set-password", { password: newPassword });
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save that password.");
        return;
      }
      toast.success("Password saved. Next time just use that.");
      router.push(nextPath);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const skipPassword = () => {
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <Link href="/" className="inline-block">
        <Logo />
      </Link>

      {/* ---------------- email ---------------- */}
      {stage === "email" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStage("password");
          }}
          className="mt-10"
        >
          <CoffeeCup className="h-14 w-14" />
          <h1 className="mt-5 font-display text-5xl leading-none text-ink">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            Confirm your address, connect LinkedIn, answer one question. After
            that everything happens in your inbox — so use one you actually read.
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
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-primary font-display text-xl tracking-wide text-ink hover:bg-primary"
          >
            Continue <ArrowRight className="ml-1 h-5 w-5" />
          </Button>

        </form>
      )}

      {/* ---------------- password ---------------- */}
      {stage === "password" && (
        <form onSubmit={signIn} className="mt-10">
          <KeyRound className="h-14 w-14 text-roast" strokeWidth={1.6} />
          <h1 className="mt-5 font-display text-5xl leading-none text-ink">
            Enter your password
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            Signing in as <strong className="text-ink">{email}</strong>. First time
            here, or never set one? Use a code instead.
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
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-primary font-display text-xl tracking-wide text-ink hover:bg-primary disabled:opacity-45"
          >
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Sign in
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={requestCode}
            className="mt-3 h-11 w-full font-semibold text-bark hover:bg-sand"
          >
            Email me a code instead
          </Button>

          <button
            type="button"
            onClick={() => setStage("email")}
            className="mt-4 w-full text-sm font-semibold text-olive hover:text-roast"
          >
            Use a different email
          </button>
        </form>
      )}

      {/* ---------------- code ---------------- */}
      {stage === "code" && (
        <form onSubmit={verify} className="mt-10">
          <MailCheck className="h-14 w-14 text-roast" strokeWidth={1.6} />
          <h1 className="mt-5 font-display text-5xl leading-none text-ink">
            Check your email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            We sent a six-digit code to <strong className="text-ink">{email}</strong>.
            It expires in ten minutes.
          </p>

          {mailBlocked && (
            <div className="sticker mt-5 rounded-xl bg-berry/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-berry">
                That email couldn&apos;t be delivered
              </p>
              <p className="mt-1 text-sm leading-relaxed text-bark">{mailBlocked}</p>
              <p className="mt-2 text-xs leading-relaxed text-olive">
                The mail provider rejected this recipient. Check the sending
                domain is verified for the configured inbox.
              </p>
            </div>
          )}

          {devCode && (
            <div className="sticker mt-5 rounded-xl bg-primary/25 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-olive">
                No mail provider configured
              </p>
              <p className="mt-1 text-sm text-bark">
                Nothing was delivered. Your code is{" "}
                <strong className="font-display text-xl tracking-widest text-ink">
                  {devCode}
                </strong>{" "}
                — also in the{" "}
                <Link href="/outbox" className="font-semibold text-roast underline">
                  outbox
                </Link>
                .
              </p>
            </div>
          )}
          {delivery && delivery !== "outbox" && !mailBlocked && (
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
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-roast font-display text-xl tracking-wide text-white hover:bg-roast disabled:opacity-45"
          >
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Confirm
          </Button>

          <button
            type="button"
            onClick={() => {
              setStage("email");
              setCode("");
              setMailBlocked(null);
            }}
            className="mt-4 w-full text-sm font-semibold text-olive hover:text-roast"
          >
            Use a different email
          </button>
        </form>
      )}

      {/* ---------------- set a password ---------------- */}
      {stage === "set-password" && (
        <form onSubmit={savePassword} className="mt-10">
          <ShieldCheck className="h-14 w-14 text-matcha" strokeWidth={1.6} />
          <h1 className="mt-5 font-display text-5xl leading-none text-ink">
            Set a password?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bark">
            Optional. With one you can sign straight in next time instead of
            waiting on an email. Codes keep working either way.
          </p>

          <div className="mt-7 flex flex-col gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-olive">
              New password
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
            className="sticker sticker-press mt-6 h-12 w-full rounded-xl bg-primary font-display text-xl tracking-wide text-ink hover:bg-primary disabled:opacity-45"
          >
            {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Save and continue
          </Button>

          <button
            type="button"
            onClick={skipPassword}
            className="mt-4 w-full text-sm font-semibold text-olive hover:text-roast"
          >
            Skip — I&apos;ll use email codes
          </button>
        </form>
      )}
    </div>
  );
}
