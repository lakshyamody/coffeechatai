import type { Profile, RoundResult } from "./types";
import { runRound } from "./matching";
import { T, exec, getMeta, query, queryOne, setMeta } from "./db";

/**
 * Everything above this file talks to these functions and nothing else, so
 * the storage engine is swappable without touching the matcher or the UI.
 *
 * There is no seed data. The pool is whoever has actually signed up.
 */

interface ProfileRow {
  data: string;
}

const parse = (row: ProfileRow): Profile => JSON.parse(row.data) as Profile;

export async function allProfiles(): Promise<Profile[]> {
  const rows = await query<ProfileRow>(
    `SELECT data FROM ${T}profiles ORDER BY created_at ASC`,
  );
  return rows.map(parse);
}

export async function profileCount(): Promise<number> {
  const row = await queryOne<{ n: number | string }>(
    `SELECT COUNT(*) AS n FROM ${T}profiles`,
  );
  return Number(row?.n ?? 0);
}

export async function getProfile(id: string): Promise<Profile | null> {
  const row = await queryOne<ProfileRow>(`SELECT data FROM ${T}profiles WHERE id = ?`, [id]);
  return row ? parse(row) : null;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const row = await queryOne<ProfileRow>(`SELECT data FROM ${T}profiles WHERE email = ?`, [
    email.trim().toLowerCase(),
  ]);
  return row ? parse(row) : null;
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
  const now = new Date().toISOString();
  await exec(
    `INSERT INTO ${T}profiles (id, email, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       data = EXCLUDED.data,
       updated_at = EXCLUDED.updated_at`,
    [profile.id, profile.email.toLowerCase(), JSON.stringify(profile), now, now],
  );
  invalidateRound();
  return profile;
}

export async function removeProfile(id: string): Promise<void> {
  await exec(`DELETE FROM ${T}profiles WHERE id = ?`, [id]);
  invalidateRound();
}

/* ------------------------------------------------------------------------
   Rounds
   ------------------------------------------------------------------------ */

const globalRef = globalThis as unknown as { __brewedRound?: RoundResult | null };

export async function getRoundNumber(): Promise<number> {
  const raw = await getMeta("roundNumber");
  if (raw) return Number(raw);
  await setMeta("roundNumber", "1");
  return 1;
}

/** Solved on demand and cached until the pool changes. */
export async function currentRound(): Promise<RoundResult> {
  if (!globalRef.__brewedRound) {
    globalRef.__brewedRound = runRound(await allProfiles());
  }
  return globalRef.__brewedRound;
}

export function invalidateRound(): void {
  globalRef.__brewedRound = null;
}

/**
 * Close the round: everyone who met records the other in their history,
 * which permanently removes that pair from future rounds.
 */
export async function commitRound(): Promise<{ roundNumber: number; recorded: number }> {
  const round = await currentRound();
  const number = await getRoundNumber();

  for (const pairing of round.pairings) {
    const [a, b] = await Promise.all([getProfile(pairing.a), getProfile(pairing.b)]);
    if (!a || !b) continue;
    await upsertProfile({ ...a, history: [...new Set([...a.history, b.id])] });
    await upsertProfile({ ...b, history: [...new Set([...b.history, a.id])] });
  }

  await exec(
    `INSERT INTO ${T}rounds (number, closed_at, chats, held_over, strategy, avg_score)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (number) DO NOTHING`,
    [
      number,
      new Date().toISOString(),
      round.pairings.length,
      round.unmatched.length,
      round.strategy,
      round.stats.averageScore,
    ],
  );

  await setMeta("roundNumber", String(number + 1));
  invalidateRound();
  return { roundNumber: number + 1, recorded: round.pairings.length };
}

/* ------------------------------------------------------------------------
   Live figures — computed, never asserted
   ------------------------------------------------------------------------ */

export interface LiveStats {
  members: number;
  chatsArranged: number;
  roundsClosed: number;
  raters: number;
  ratedChats: number;
  averageRating: number | null;
  cities: number;
}

export async function liveStats(): Promise<LiveStats> {
  const totals = await queryOne<{ n: number | string; chats: number | string | null }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(chats), 0) AS chats FROM ${T}rounds`,
  );
  const profiles = await allProfiles();
  const ratings = profiles.flatMap((p) =>
    p.signals.filter((s) => s.kind === "rated" && typeof s.rating === "number"),
  );

  return {
    members: profiles.length,
    chatsArranged: Number(totals?.chats ?? 0),
    roundsClosed: Number(totals?.n ?? 0),
    raters: profiles.filter((p) => (p.preferences?.observations ?? 0) > 0).length,
    ratedChats: ratings.length,
    averageRating: ratings.length
      ? ratings.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratings.length
      : null,
    cities: new Set(profiles.map((p) => p.city)).size,
  };
}

export function nextId(): string {
  return `u${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
