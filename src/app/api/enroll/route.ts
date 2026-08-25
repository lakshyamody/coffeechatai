import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { Direction, Format, Profile, Seniority } from "@/lib/types";
import {
  allProfiles,
  getProfile,
  getProfileByEmail,
  getRoundNumber,
  invalidateRound,
  nextId,
  upsertProfile,
} from "@/lib/store";
import { rankAgainstPool } from "@/lib/matching";
import { DEFAULT_AVAILABILITY, popcount } from "@/lib/availability";
import { extractProfile } from "@/lib/extractor";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { cityByName } from "@/lib/cities";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  issueSession,
  normaliseEmail,
  readSession,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Draft {
  linkedinUrl?: string;
  linkedinText?: string;
  wantToMeet?: string;
  /** Optional refinements; sensible defaults are used when absent. */
  availability?: number;
  format?: string;
  city?: string;
}

const FORMATS: Format[] = ["virtual", "in-person", "either"];

const text = (v: unknown, max = 6000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  // The email is never taken from the request body — only from a proven
  // session or a code just verified. Otherwise anyone could enrol under
  // someone else's address and receive their matches.
  const jar = await cookies();
  const sessionId = readSession(jar.get(SESSION_COOKIE)?.value);
  const pendingEmail = jar.get("brewed_pending_email")?.value;
  const sessionProfile = sessionId ? await getProfile(sessionId) : null;
  const email = sessionProfile?.email ?? (pendingEmail ? normaliseEmail(pendingEmail) : null);

  if (!email) {
    return NextResponse.json(
      { error: "Verify your email before joining a round." },
      { status: 401 },
    );
  }

  let draft: Draft;
  try {
    draft = (await request.json()) as Draft;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const wantToMeet = text(draft.wantToMeet, 1000);
  const linkedinText = text(draft.linkedinText);
  const linkedinUrl = text(draft.linkedinUrl, 300);

  if (wantToMeet.length < 10) {
    return NextResponse.json(
      { error: "Tell us who you'd like to meet — a sentence is plenty." },
      { status: 422 },
    );
  }
  if (linkedinText.length < 20 && !linkedinUrl) {
    return NextResponse.json(
      { error: "Paste something from your LinkedIn so we know who you are." },
      { status: 422 },
    );
  }

  // One model call replaces the nine screens this used to be: it reads the
  // LinkedIn text and the answer, and produces the tags, seniority and
  // structured profile the matcher scores on.
  const { fields, structured, source } = await extractProfile({
    linkedinText,
    linkedinUrl,
    wantToMeet,
    email,
  });

  const existing = sessionProfile ?? (await getProfileByEmail(email));
  const city = text(draft.city, 80) || fields.city || existing?.city || "Remote";
  const availability =
    Number.isInteger(draft.availability) && popcount(draft.availability!) >= 3
      ? draft.availability!
      : (existing?.availability ?? DEFAULT_AVAILABILITY);
  const format = FORMATS.includes(draft.format as Format)
    ? (draft.format as Format)
    : (existing?.format ?? "either");

  const role = fields.role || "Curious human";
  const company = fields.company || "Independent";
  const name = fields.name || existing?.name || email.split("@")[0];

  const profile: Profile = {
    id: existing?.id ?? nextId(),
    name,
    email,
    headline: `${role} @ ${company}`,
    role,
    company,
    seniority: Math.min(4, Math.max(0, Math.round(fields.seniority))) as Seniority,
    city,
    utcOffset: cityByName(city)?.offset ?? existing?.utcOffset ?? 0,
    format,
    goals: fields.goals,
    offers: fields.offers,
    seeks: fields.seeks,
    topics: fields.topics,
    direction: fields.direction as Direction,
    concreteness: fields.concreteness,
    talkativeness: fields.talkativeness,
    availability,
    history: existing?.history ?? [],
    blocked: existing?.blocked ?? [],
    optedIn: true,
    joinedAt: existing?.joinedAt ?? new Date().toISOString(),
    avatarSeed: existing?.avatarSeed ?? Math.floor(Math.random() * 10000),
    signals: existing?.signals ?? [],
    preferences: existing?.preferences,
    emailVerified: true,
    structured,
    linkedinUrl: linkedinUrl || existing?.linkedinUrl,
  };

  await upsertProfile(profile);
  invalidateRound();

  await sendEmail({
    to: profile.email,
    ...welcomeEmail({
      name: profile.name,
      roundNumber: await getRoundNumber(),
      summary: structured.summary,
    }),
  });

  const preview = rankAgainstPool(profile, await allProfiles(), 3).map((c) => ({
    name: c.profile.name,
    headline: c.profile.headline,
    city: c.profile.city,
    avatarSeed: c.profile.avatarSeed,
    score: Math.round(c.score.total),
  }));

  const response = NextResponse.json({
    id: profile.id,
    preview,
    structured,
    source,
    derived: {
      headline: profile.headline,
      city: profile.city,
      offers: profile.offers,
      seeks: profile.seeks,
      topics: profile.topics,
      direction: profile.direction,
    },
  });
  response.cookies.set(SESSION_COOKIE, issueSession(profile.id), SESSION_COOKIE_OPTIONS);
  response.cookies.set("brewed_pending_email", "", { path: "/", maxAge: 0 });
  return response;
}
