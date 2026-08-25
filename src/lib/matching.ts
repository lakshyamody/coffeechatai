import type { Pairing, Profile, RoundResult, ScoreBreakdown } from "./types";
import {
  bestSlot,
  canMeet,
  dealBreakerBetween,
  explain,
  scorePair,
  starters,
} from "./scoring";
import { personalTotal } from "./preferences";
import { popcount } from "./availability";
import {
  countBlockingPairs,
  greedyMaxWeight,
  stableRoommates,
  type PrefLists,
} from "./irving";

/** Cap each person's preference list — keeps Irving's phase 2 tractable. */
const MAX_CANDIDATES = 40;

interface Edge {
  a: string;
  b: string;
  /** Symmetric, population-weighted. This is the number both people see. */
  score: number;
  /** Mean of the two personal scores — what the assignment optimises. */
  mutual: number;
  breakdown: ScoreBreakdown;
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Stage 1 — candidate generation.
 *
 * Cheap structural filters only: identity, blocks, history, deal-breakers,
 * whether they can physically meet, and whether their calendars touch at
 * all. Everything that survives is worth paying for a full score.
 *
 * At 64 people this is a rounding error, but it's the stage that keeps the
 * round tractable as the pool grows — full scoring is far more expensive
 * than a bitmask AND and a couple of set lookups.
 */
export function generateCandidates(pool: Profile[]): Array<[Profile, Profile]> {
  const candidates: Array<[Profile, Profile]> = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i];
      const b = pool[j];
      if (a.blocked.includes(b.id) || b.blocked.includes(a.id)) continue;
      if (a.history.includes(b.id) || b.history.includes(a.id)) continue;
      if (!canMeet(a, b)) continue;
      if (popcount(a.availability & b.availability) === 0) continue;
      if (dealBreakerBetween(a, b)) continue;
      candidates.push([a, b]);
    }
  }
  return candidates;
}

/** Stage 2 — score every surviving candidate. */
function buildEdges(pool: Profile[]): Edge[] {
  const edges: Edge[] = [];
  for (const [a, b] of generateCandidates(pool)) {
    const s = scorePair(a, b);
    if (!s) continue;
    edges.push({
      a: a.id,
      b: b.id,
      score: s.total,
      mutual: (personalTotal(a, s) + personalTotal(b, s)) / 2,
      breakdown: s,
    });
  }
  return edges;
}

/**
 * Each person's ranked list, ordered by *their own* learned weights.
 *
 * This is the natural home for personal preference: stable roommates
 * consumes one ranked list per person, so an asymmetric notion of "better"
 * is not a problem here — it's the input the algorithm was designed for.
 */
function buildPrefLists(pool: Profile[], edges: Edge[]): PrefLists {
  const byId = new Map(pool.map((p) => [p.id, p]));
  const byPerson = new Map<string, Array<{ id: string; score: number }>>();
  for (const p of pool) byPerson.set(p.id, []);
  for (const e of edges) {
    const pa = byId.get(e.a);
    const pb = byId.get(e.b);
    if (!pa || !pb) continue;
    byPerson.get(e.a)?.push({ id: e.b, score: personalTotal(pa, e.breakdown) });
    byPerson.get(e.b)?.push({ id: e.a, score: personalTotal(pb, e.breakdown) });
  }
  const prefs: PrefLists = new Map();
  for (const [id, list] of byPerson) {
    prefs.set(
      id,
      list
        .sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : 1))
        .slice(0, MAX_CANDIDATES)
        .map((c) => c.id),
    );
  }
  // A truncated list can be asymmetric (A keeps B but B dropped A). Irving
  // requires symmetry, so drop any one-sided entries.
  for (const [id, list] of prefs) {
    prefs.set(id, list.filter((other) => prefs.get(other)?.includes(id)));
  }
  return prefs;
}

/**
 * Greedy is fast but strands people: once someone's viable partners are all
 * taken, they sit out even when a rearrangement would have seated everyone.
 * Two repair passes fix that, then 2-opt claws back the weight greedy lost.
 *
 * Only ever applied to the greedy result — running this over a stable
 * matching would trade away the stability that made it worth computing.
 */
function repairAndImprove(
  matching: Map<string, string>,
  ids: string[],
  scoreOf: (a: string, b: string) => number | null,
  adjacency: Map<string, string[]>,
): void {
  const link = (a: string, b: string) => {
    matching.set(a, b);
    matching.set(b, a);
  };
  const unmatchedNow = () => ids.filter((i) => !matching.has(i));

  // Pass A — seat leftovers with each other, best pairs first.
  for (;;) {
    const left = unmatchedNow();
    if (left.length < 2) break;
    const cands: Array<{ a: string; b: string; s: number }> = [];
    for (let i = 0; i < left.length; i++) {
      for (let j = i + 1; j < left.length; j++) {
        const s = scoreOf(left[i], left[j]);
        if (s !== null) cands.push({ a: left[i], b: left[j], s });
      }
    }
    if (!cands.length) break;
    cands.sort((x, y) => y.s - x.s);
    const taken = new Set<string>();
    let placed = 0;
    for (const c of cands) {
      if (taken.has(c.a) || taken.has(c.b)) continue;
      link(c.a, c.b);
      taken.add(c.a);
      taken.add(c.b);
      placed++;
    }
    if (!placed) break;
  }

  // Pass B — length-3 augmentation. Break one existing pair (x,y) so that
  // x takes an unmatched u and y takes a different unmatched u2: one pair
  // plus two strays becomes two pairs.
  for (;;) {
    const left = unmatchedNow();
    if (left.length < 2) break;
    let augmented = false;

    search: for (const u of left) {
      for (const x of adjacency.get(u) ?? []) {
        const y = matching.get(x);
        if (y === undefined) continue;
        for (const u2 of left) {
          if (u2 === u || u2 === x || u2 === y) continue;
          if (scoreOf(y, u2) === null) continue;
          link(u, x);
          link(y, u2);
          augmented = true;
          break search;
        }
      }
    }
    if (!augmented) break;
  }

  // Pass C — 2-opt. For any two pairs, test both re-crossings and keep a
  // strict improvement. Converges in a handful of passes.
  for (let pass = 0; pass < 6; pass++) {
    const seen = new Set<string>();
    const pairs: Array<[string, string]> = [];
    for (const [a, b] of matching) {
      const k = pairKey(a, b);
      if (seen.has(k)) continue;
      seen.add(k);
      pairs.push([a, b]);
    }

    let gained = false;
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const [a, b] = pairs[i];
        const [c, d] = pairs[j];
        const current = (scoreOf(a, b) ?? 0) + (scoreOf(c, d) ?? 0);

        const ac = scoreOf(a, c);
        const bd = scoreOf(b, d);
        const ad = scoreOf(a, d);
        const bc = scoreOf(b, c);
        const cross1 = ac !== null && bd !== null ? ac + bd : -Infinity;
        const cross2 = ad !== null && bc !== null ? ad + bc : -Infinity;

        if (cross1 > current + 1e-9 && cross1 >= cross2) {
          link(a, c);
          link(b, d);
          pairs[i] = [a, c];
          pairs[j] = [b, d];
          gained = true;
        } else if (cross2 > current + 1e-9) {
          link(a, d);
          link(b, c);
          pairs[i] = [a, d];
          pairs[j] = [b, c];
          gained = true;
        }
      }
    }
    if (!gained) break;
  }
}

/**
 * Run one matching round over everyone who is opted in.
 *
 * Strategy: try for a *stable* matching first (nobody has an incentive to
 * defect), and only fall back to score maximisation if no stable matching
 * exists — which, for stable roommates, it often doesn't.
 */
export function runRound(profiles: Profile[]): RoundResult {
  const startedAt = Date.now();
  let pool = profiles.filter((p) => p.optedIn);

  const edges = buildEdges(pool);
  const edgeMap = new Map<string, Edge>();
  for (const e of edges) edgeMap.set(pairKey(e.a, e.b), e);

  const unmatched: string[] = [];

  // Anyone with no viable partner at all sits this round out.
  const degree = new Map<string, number>(pool.map((p) => [p.id, 0]));
  for (const e of edges) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }
  const isolated = pool.filter((p) => (degree.get(p.id) ?? 0) === 0);
  if (isolated.length) {
    unmatched.push(...isolated.map((p) => p.id));
    pool = pool.filter((p) => (degree.get(p.id) ?? 0) > 0);
  }

  // Odd pool: hold out the person with the fewest options — they lose the
  // least by waiting, and everyone else still gets their best available.
  if (pool.length % 2 === 1) {
    const holdout = [...pool].sort(
      (x, y) => (degree.get(x.id) ?? 0) - (degree.get(y.id) ?? 0),
    )[0];
    unmatched.push(holdout.id);
    pool = pool.filter((p) => p.id !== holdout.id);
  }

  const livePool = new Set(pool.map((p) => p.id));
  const liveEdges = edges.filter((e) => livePool.has(e.a) && livePool.has(e.b));
  const prefs = buildPrefLists(pool, liveEdges);

  // Assignment optimises the mutual score (both people's own weights);
  // the displayed score stays symmetric and population-weighted.
  const scoreOf = (a: string, b: string) => edgeMap.get(pairKey(a, b))?.mutual ?? null;
  const adjacency = new Map<string, string[]>();
  for (const p of pool) adjacency.set(p.id, []);
  for (const e of liveEdges) {
    adjacency.get(e.a)?.push(e.b);
    adjacency.get(e.b)?.push(e.a);
  }
  for (const [id, list] of adjacency) {
    adjacency.set(id, list.sort((x, y) => (scoreOf(id, y) ?? 0) - (scoreOf(id, x) ?? 0)));
  }

  let strategy: RoundResult["strategy"] = "stable-roommates";
  let matching = new Map<string, string>();

  const irving = stableRoommates(prefs);
  if (irving.ok && irving.matching.size === pool.length) {
    matching = irving.matching;
  } else {
    strategy = "greedy-max-weight";
    matching = greedyMaxWeight(
      liveEdges.map((e) => ({ a: e.a, b: e.b, score: e.mutual })),
    );
    repairAndImprove(
      matching,
      pool.map((p) => p.id),
      scoreOf,
      adjacency,
    );
  }

  const byId = new Map(profiles.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const pairings: Pairing[] = [];

  for (const [a, b] of matching) {
    const k = pairKey(a, b);
    if (seen.has(k)) continue;
    seen.add(k);
    const pa = byId.get(a);
    const pb = byId.get(b);
    if (!pa || !pb) continue;
    const breakdown = edgeMap.get(k)?.breakdown ?? scorePair(pa, pb);
    if (!breakdown) continue;
    pairings.push({
      a,
      b,
      score: breakdown,
      reasons: explain(pa, pb, breakdown, "neutral"),
      slot: bestSlot(pa, pb),
      starters: starters(pa, pb),
    });
  }

  for (const p of pool) {
    if (!matching.has(p.id)) unmatched.push(p.id);
  }

  const averageScore =
    pairings.length === 0
      ? 0
      : pairings.reduce((sum, p) => sum + p.score.total, 0) / pairings.length;

  return {
    pairings: pairings.sort((x, y) => y.score.total - x.score.total),
    unmatched,
    strategy,
    stats: {
      poolSize: profiles.filter((p) => p.optedIn).length,
      candidateEdges: edges.length,
      averageScore,
      blockingPairs: countBlockingPairs(matching, prefs),
      elapsedMs: Date.now() - startedAt,
    },
  };
}

/**
 * Rank the whole pool against one person. Used for the instant preview at
 * the end of onboarding ("here's who you'd meet if the round ran now").
 */
export function rankAgainstPool(
  me: Profile,
  pool: Profile[],
  limit = 5,
): Array<{ profile: Profile; score: ScoreBreakdown }> {
  return pool
    .filter((p) => p.id !== me.id && p.optedIn)
    .map((p) => ({ profile: p, score: scorePair(me, p) }))
    .filter((r): r is { profile: Profile; score: ScoreBreakdown } => r.score !== null)
    .sort((x, y) => y.score.total - x.score.total)
    .slice(0, limit);
}

export function pairingFor(round: RoundResult, id: string): Pairing | null {
  return round.pairings.find((p) => p.a === id || p.b === id) ?? null;
}
