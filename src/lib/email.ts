import { ROUND_LABELS, sendsAt } from "./schedule";
import { T, exec, query } from "./db";

/**
 * Email delivery.
 *
 *   agentmail — sends from an AgentMail inbox on their own verified domain,
 *               so mail reaches any recipient.
 *   outbox    — the fallback when no key is set. Records the message and
 *               nothing leaves the machine, so signup, verification, and
 *               match notifications stay exercisable with no credentials.
 *
 * The outbox is not a stub of a missing feature; it is what makes the flow
 * demonstrable. /outbox renders whatever it holds, whichever transport ran.
 */

export type Transport = "agentmail" | "outbox";

export interface DeliveryProblem {
  /** Safe to show a visitor. */
  message: string;
  /** True when waiting or configuration fixes it, rather than retrying. */
  blocked: boolean;
}

/**
 * Turn a provider error into something a person can act on.
 *
 * These were all collapsing into "We couldn't send that email", which sends
 * someone off to check their spam folder for a message that was never
 * accepted. The two that actually happen are worth naming exactly.
 */
export function explainDeliveryError(raw: string): DeliveryProblem {
  const limit = /recipient limit|rate_limit_exceeded/i.test(raw);
  if (limit) {
    const lifts = raw.match(/lifts at ([0-9T:.\-]+Z)/)?.[1];
    const when = lifts
      ? new Date(lifts).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
    return {
      blocked: true,
      message: `Our mail account is new, and the provider caps how many different people it can write to for the first few days${
        when ? ` — the cap lifts on ${when}` : ""
      }. Nothing's wrong with your address.`,
    };
  }
  if (/only send testing emails|verify a domain|not verified/i.test(raw)) {
    return {
      blocked: true,
      message:
        "We can't email this address yet. The sending domain isn't verified, so mail only reaches the provider account owner.",
    };
  }
  return { blocked: false, message: "We couldn't send that email. Try again in a moment." };
}

export interface OutboundEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  sentAt: string;
  transport: Transport;
  error?: string;
}

interface EmailRow {
  id: string;
  to_addr: string;
  subject: string;
  html: string;
  body: string;
  sent_at: string;
  transport: string;
  error: string | null;
}

export async function outbox(limit = 60): Promise<OutboundEmail[]> {
  const rows = await query<EmailRow>(
    `SELECT id, to_addr, subject, html, body, sent_at, transport, error FROM ${T}emails ORDER BY sent_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    to: r.to_addr,
    subject: r.subject,
    html: r.html,
    text: r.body,
    sentAt: r.sent_at,
    transport: r.transport as OutboundEmail["transport"],
    error: r.error ?? undefined,
  }));
}

export async function clearOutbox(): Promise<void> {
  await exec(`DELETE FROM ${T}emails`);
}

const AGENTMAIL_INBOX =
  process.env.AGENTMAIL_INBOX_ID ?? "crashh@agentmail.to";

export function activeTransport(): Transport {
  return process.env.AGENTMAIL_API_KEY ? "agentmail" : "outbox";
}

export function emailConfigured(): boolean {
  return activeTransport() !== "outbox";
}

/** Shown in the UI so it is never a guess which provider is carrying mail. */
export function transportLabel(): string {
  switch (activeTransport()) {
    case "agentmail":
      return `AgentMail (${AGENTMAIL_INBOX})`;
    default:
      return "Not configured — captured locally";
  }
}

async function viaAgentMail(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<string | undefined> {
  const response = await fetch(
    `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(AGENTMAIL_INBOX)}/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AGENTMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return `AgentMail ${response.status}: ${detail.slice(0, 200)}`;
  }
  return undefined;
}

export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<OutboundEmail> {
  const transport = activeTransport();
  const record: OutboundEmail = {
    id: `m_${Math.random().toString(36).slice(2, 10)}`,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    sentAt: new Date().toISOString(),
    transport,
  };

  try {
    if (transport === "agentmail") record.error = await viaAgentMail(msg);
  } catch (err) {
    record.error = err instanceof Error ? err.message : String(err);
  }

  if (record.error) {
    console.error(`[email:${transport}] ${msg.to} — ${msg.subject} FAILED: ${record.error}`);
  } else {
    console.log(`[email:${transport}] ${msg.to} — ${msg.subject}`);
  }

  await exec(
    `INSERT INTO ${T}emails (id, to_addr, subject, html, body, sent_at, transport, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.to,
      record.subject,
      record.html,
      record.text,
      record.sentAt,
      record.transport,
      record.error ?? null,
    ],
  );
  return record;
}

/* ------------------------------------------------------------------------
   Templates
   ------------------------------------------------------------------------ */

const CREAM = "#f0efdc";
const INK = "#0d0c0b";
const ROAST = "#c0562b";
const OLIVE = "#646446";

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK}">
  <div style="max-width:520px;margin:0 auto">
    <div style="font-size:22px;font-weight:800;letter-spacing:-0.4px;margin-bottom:18px">&#9749; brewed</div>
    <div style="background:#fff;border:2px solid ${INK};border-radius:16px;padding:26px;box-shadow:5px 5px 0 0 ${INK}">
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2">${title}</h1>
      ${body}
    </div>
    <p style="margin:18px 4px 0;font-size:12px;color:${OLIVE}">
      One good conversation a week. Reply STOP to leave the pool.
    </p>
  </div>
</body></html>`;
}

const p = (text: string) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">${text}</p>`;

export function verificationEmail(code: string) {
  return {
    subject: `${code} is your Brewed code`,
    html: layout(
      "Confirm your email",
      p("Enter this code to finish signing in. It expires in 10 minutes.") +
        `<div style="margin:18px 0;padding:14px;background:${CREAM};border:2px dashed ${INK};border-radius:12px;text-align:center;font-size:34px;font-weight:800;letter-spacing:10px">${code}</div>` +
        p(
          `<span style="color:${OLIVE};font-size:13px">If you didn't ask for this, you can ignore it — nobody can sign in without the code.</span>`,
        ),
    ),
    text: `Your Brewed code is ${code}. It expires in 10 minutes.`,
  };
}

export function welcomeEmail(opts: { name: string; roundNumber: number; summary: string }) {
  return {
    subject: `You're in round ${opts.roundNumber}`,
    html: layout(
      `You're in, ${opts.name.split(" ")[0]}`,
      p(
        `We've built your profile and added you to round ${opts.roundNumber}. Here's how we read you:`,
      ) +
        `<div style="margin:14px 0;padding:14px;background:${CREAM};border-radius:12px;font-size:15px;line-height:1.6;font-style:italic">${opts.summary}</div>` +
        p(
          `The round is solved ${ROUND_LABELS.closesDay} at midnight. ${sendsAt} you'll get one person, why the two of you, and their email so you can set it up directly.`,
        ) +
        p(
          `<span style="color:${OLIVE};font-size:13px">Not right? Update your answers any time and we'll re-read you before the next round.</span>`,
        ),
    ),
    text: `You're in round ${opts.roundNumber}. How we read you: ${opts.summary}`,
  };
}

export function matchEmail(opts: {
  name: string;
  matchName: string;
  matchHeadline: string;
  matchEmail: string;
  matchCity: string;
  score: number;
  reasons: Array<{ label: string; detail: string }>;
  bookingUrl: string | null;
  inPerson: boolean;
  dashboardUrl: string;
}) {
  const reasonHtml = opts.reasons
    .map(
      (r) =>
        `<div style="margin:0 0 10px"><div style="font-weight:700;font-size:14px">${r.label}</div><div style="font-size:14px;line-height:1.55;color:#3b3b31">${r.detail}</div></div>`,
    )
    .join("");

  return {
    subject: `Your coffee chat: ${opts.matchName}`,
    html: layout(
      `Meet ${opts.matchName}`,
      `<div style="margin:0 0 16px;padding:14px;background:${CREAM};border-radius:12px">
         <div style="font-size:19px;font-weight:800">${opts.matchName}</div>
         <div style="font-size:14px;color:${OLIVE};margin-top:2px">${opts.matchHeadline}</div>
         <div style="font-size:14px;color:${OLIVE};margin-top:2px">Video call — they're in ${opts.matchCity}</div>
         <div style="margin-top:10px;font-size:14px">
           <a href="mailto:${opts.matchEmail}" style="color:${ROAST};font-weight:700;text-decoration:none">${opts.matchEmail}</a>
         </div>
       </div>` +
        `<div style="font-weight:800;font-size:15px;margin:0 0 10px">Why you two &middot; ${Math.round(opts.score)}/100</div>` +
        reasonHtml +
        (opts.bookingUrl
          ? p(
              `<strong>They take bookings.</strong> Pick a time that suits you — no scheduling thread needed.`,
            )
          : "") +
        `<div style="margin-top:20px">
           ${
             opts.bookingUrl
               ? `<a href="${opts.bookingUrl}" style="display:inline-block;background:#ffcd2a;color:${INK};border:2px solid ${INK};border-radius:10px;padding:11px 20px;font-weight:800;text-decoration:none">Book a time with ${opts.matchName.split(" ")[0]}</a> `
               : ""
           }<a href="mailto:${opts.matchEmail}?subject=${encodeURIComponent(
             "Coffee chat this week?",
           )}" style="display:inline-block;background:${opts.bookingUrl ? "#fff" : "#ffcd2a"};color:${INK};border:2px solid ${INK};border-radius:10px;padding:11px 20px;font-weight:800;text-decoration:none">Email ${opts.matchName.split(" ")[0]}</a>
           <a href="${opts.dashboardUrl}" style="display:inline-block;margin-left:8px;color:${OLIVE};font-size:14px;text-decoration:underline;padding:11px 0">See the full match</a>
         </div>`,
    ),
    text: `Your coffee chat this week: ${opts.matchName} (${opts.matchHeadline}) — ${opts.matchEmail}.${
      opts.bookingUrl ? ` Book a time: ${opts.bookingUrl}.` : ""
    } Full match: ${opts.dashboardUrl}`,
  };
}

export function feedbackRequestEmail(opts: {
  matchName: string;
  feedbackUrl: string;
}) {
  return {
    subject: `How was your chat with ${opts.matchName}?`,
    html: layout(
      "How did it go?",
      p(
        `Thirty seconds on your chat with ${opts.matchName} makes your next match better — we tune your matching on what you tell us here.`,
      ) +
        `<div style="margin-top:18px"><a href="${opts.feedbackUrl}" style="display:inline-block;background:#ffcd2a;color:${INK};border:2px solid ${INK};border-radius:10px;padding:11px 20px;font-weight:800;text-decoration:none">Rate the chat</a></div>`,
    ),
    text: `How was your chat with ${opts.matchName}? Rate it: ${opts.feedbackUrl}`,
  };
}
