import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { DealBreaker, Direction, Format, Profile, Seniority } from "@/lib/types";
import { DEAL_BREAKERS } from "@/lib/types";
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
import { popcount } from "@/lib/availability";
import { extractProfile } from "@/lib/extractor";
import { sendEmail, welcomeEmail } from "@/lib/email";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  issueSession,
  normaliseEmail,
  readSession,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

interface Draft {
  name?: string;
  role?: string;
  company?: string;
  city?: string;
  utcOffset?: number;
  seniority?: number;
  direction?: string;
  format?: string;
  goals?: string[];
  offers?: string[];
  seeks?: string[];
  topics?: string[];
  dealBreakers?: string[];
  concreteness?: number;
  talkativeness?: number;
  availability?: number;
  workingOn?: string;
  greatChat?: string;
  avoid?: string;
}

const DIRECTIONS: Direction[] = ["senior", "peer", "junior", "any"];
const FORMATS: Format[] = ["virtual", "in-person", "either"];
const DEAL_BREAKER_IDS = DEAL_BREAKERS.map((d) => d.id);

const clamp01 = (n: unknown, fallback = 0.5) =>
  Math.min(1, Math.max(0, typeof n === "number" && Number.isFinite(n) ? n : fallback));

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const text = (v: unknown, max = 1200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  // The email is never taken from the request body — only from a proven
  // session or a code the user just verified. Otherwise anyone could enrol
  // under someone else's address and receive their matches.
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

  const name = (draft.name ?? "").trim();
  const availability = Number.isInteger(draft.availability) ? draft.availability! : 0;

  const problems: string[] = [];
  if (name.length < 2) problems.push("Tell us your name.");
  if (strings(draft.offers).length === 0) problems.push("Pick at least one thing you can offer.");
  if (strings(draft.seeks).length === 0) problems.push("Pick at least one thing you're after.");
  if (popcount(availability) < 3) {
    problems.push("Mark at least 3 blocks you're free — fewer and we can't find a time.");
  }
  if (problems.length) {
    return NextResponse.json({ error: problems[0], problems }, { status: 422 });
  }

  const seniority = Math.min(4, Math.max(0, Math.round(draft.seniority ?? 1))) as Seniority;
  const direction = DIRECTIONS.includes(draft.direction as Direction)
    ? (draft.direction as Direction)
    : "any";
  const format = FORMATS.includes(draft.format as Format)
    ? (draft.format as Format)
    : "either";
  const role = (draft.role ?? "").trim() || "Curious human";
  const company = (draft.company ?? "").trim() || "Independent";
  const city = (draft.city ?? "").trim() || "Remote";
  const declaredDealBreakers = strings(draft.dealBreakers).filter(
    (d): d is DealBreaker => (DEAL_BREAKER_IDS as string[]).includes(d),
  );

  const existing = sessionProfile ?? await getProfileByEmail(email);

  const profile: Profile = {
    id: existing?.id ?? nextId(),
    name,
    email,
    headline: `${role} @ ${company}`,
    role,
    company,
    seniority,
    city,
    utcOffset: typeof draft.utcOffset === "number" ? draft.utcOffset : 0,
    format,
    goals: strings(draft.goals),
    offers: strings(draft.offers),
    seeks: strings(draft.seeks),
    topics: strings(draft.topics),
    direction,
    concreteness: clamp01(draft.concreteness),
    talkativeness: clamp01(draft.talkativeness),
    availability,
    history: existing?.history ?? [],
    blocked: existing?.blocked ?? [],
    optedIn: true,
    joinedAt: existing?.joinedAt ?? new Date().toISOString(),
    avatarSeed: existing?.avatarSeed ?? Math.floor(Math.random() * 10000),
    signals: existing?.signals ?? [],
    preferences: existing?.preferences,
    emailVerified: true,
  };

  // The extractor turns the raw answers into the structured representation
  // everything downstream actually reasons over.
  profile.structured = await extractProfile({
    name,
    role,
    company,
    city,
    seniority,
    goals: profile.goals,
    offers: profile.offers,
    seeks: profile.seeks,
    topics: profile.topics,
    direction,
    format,
    concreteness: profile.concreteness,
    talkativeness: profile.talkativeness,
    declaredDealBreakers,
    workingOn: text(draft.workingOn),
    greatChat: text(draft.greatChat),
    avoid: text(draft.avoid),
    signals: profile.signals,
  });

  await upsertProfile(profile);
  invalidateRound();

  await sendEmail({
    to: profile.email,
    ...welcomeEmail({
      name: profile.name,
      roundNumber: await getRoundNumber(),
      summary: profile.structured.summary,
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
    structured: profile.structured,
  });
  response.cookies.set(SESSION_COOKIE, issueSession(profile.id), SESSION_COOKIE_OPTIONS);
  response.cookies.set("brewed_pending_email", "", { path: "/", maxAge: 0 });
  return response;
}
