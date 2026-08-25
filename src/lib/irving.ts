/**
 * Irving's algorithm for the Stable Roommates problem.
 *
 * Everyone in a coffee-chat round sits in ONE pool — there is no "side A"
 * and "side B" — so Gale–Shapley doesn't apply. The correct formulation is
 * stable roommates, where a matching is stable if no two people would both
 * rather ditch their assigned partner for each other.
 *
 * Unlike stable marriage, a stable roommates instance can have no solution
 * at all. That's expected; the caller falls back to greedy max-weight.
 *
 * Reference: Irving (1985), "An efficient algorithm for the stable roommates
 * problem", Journal of Algorithms 6(4).
 */

export type PrefLists = Map<string, string[]>;

export interface IrvingResult {
  ok: boolean;
  matching: Map<string, string>;
  reason?: string;
}

function buildRanks(prefs: PrefLists): Map<string, Map<string, number>> {
  const ranks = new Map<string, Map<string, number>>();
  for (const [id, list] of prefs) {
    const m = new Map<string, number>();
    list.forEach((other, i) => m.set(other, i));
    ranks.set(id, m);
  }
  return ranks;
}

export function stableRoommates(prefsInput: PrefLists): IrvingResult {
  // Work on mutable copies.
  const prefs: PrefLists = new Map();
  for (const [k, v] of prefsInput) prefs.set(k, [...v]);
  const ranks = buildRanks(prefsInput);
  const people = [...prefs.keys()];
  const empty = new Map<string, string>();

  const prefersFirst = (chooser: string, x: string, y: string) => {
    const r = ranks.get(chooser);
    if (!r) return false;
    const rx = r.get(x);
    const ry = r.get(y);
    if (rx === undefined) return false;
    if (ry === undefined) return true;
    return rx < ry;
  };

  const removePair = (x: string, y: string) => {
    const lx = prefs.get(x);
    const ly = prefs.get(y);
    if (lx) prefs.set(x, lx.filter((p) => p !== y));
    if (ly) prefs.set(y, ly.filter((p) => p !== x));
  };

  // ---- Phase 1: proposal / rejection -------------------------------------
  const holder = new Map<string, string>(); // y -> proposer whose offer y holds
  const proposed = new Map<string, string>(); // x -> whom x is currently held by
  const cursor = new Map<string, number>(people.map((p) => [p, 0]));
  const free: string[] = [...people];

  while (free.length) {
    const x = free.pop()!;
    if (proposed.has(x)) continue;
    const list = prefs.get(x) ?? [];
    let i = cursor.get(x) ?? 0;

    while (i < list.length) {
      const y = list[i];
      i++;
      cursor.set(x, i);
      const current = holder.get(y);
      if (current === undefined) {
        holder.set(y, x);
        proposed.set(x, y);
        break;
      }
      if (prefersFirst(y, x, current)) {
        holder.set(y, x);
        proposed.set(x, y);
        proposed.delete(current);
        free.push(current);
        break;
      }
      // y rejects x outright.
      removePair(x, y);
    }

    if (!proposed.has(x) && i >= list.length) {
      return { ok: false, matching: empty, reason: `${x} exhausted their list in phase 1` };
    }
  }

  // Phase 1 reduction: y is held by x, so y can drop everyone worse than x.
  for (const [y, x] of holder) {
    const list = prefs.get(y) ?? [];
    const keep: string[] = [];
    for (const p of list) {
      if (prefersFirst(y, p, x) || p === x) keep.push(p);
      else removePair(y, p);
    }
    prefs.set(y, keep);
  }

  for (const [id, list] of prefs) {
    if (list.length === 0) {
      return { ok: false, matching: empty, reason: `${id} has no candidates after reduction` };
    }
  }

  // ---- Phase 2: rotation elimination -------------------------------------
  const first = (id: string) => prefs.get(id)![0];
  const second = (id: string) => prefs.get(id)![1];
  const last = (id: string) => {
    const l = prefs.get(id)!;
    return l[l.length - 1];
  };

  let guard = 0;
  const guardLimit = people.length * people.length + 64;

  while (true) {
    if (guard++ > guardLimit) {
      return { ok: false, matching: empty, reason: "phase 2 failed to converge" };
    }

    const start = people.find((p) => (prefs.get(p)?.length ?? 0) > 1);
    if (start === undefined) break; // every list is a singleton — done

    // Walk the rotation: b_i = second on a_i's list, a_{i+1} = last on b_i's.
    const seqA: string[] = [];
    const seqB: string[] = [];
    const seen = new Map<string, number>();
    let a = start;

    while (!seen.has(a)) {
      seen.set(a, seqA.length);
      const listA = prefs.get(a)!;
      if (listA.length < 2) {
        return { ok: false, matching: empty, reason: `rotation walk hit a singleton at ${a}` };
      }
      const b = second(a);
      seqA.push(a);
      seqB.push(b);
      a = last(b);
    }

    const cycleStart = seen.get(a)!;
    const rotA = seqA.slice(cycleStart);
    const rotB = seqB.slice(cycleStart);
    const r = rotA.length;

    // Eliminate: for each i, b_i rejects a_{i+1} (who is last on b_i's list).
    for (let i = 0; i < r; i++) {
      removePair(rotB[i], rotA[(i + 1) % r]);
    }

    for (const [id, list] of prefs) {
      if (list.length === 0) {
        return { ok: false, matching: empty, reason: `${id} was eliminated out of candidates` };
      }
    }
  }

  // Every list is a singleton — read off the matching and verify symmetry.
  const matching = new Map<string, string>();
  for (const id of people) {
    const partner = first(id);
    if (prefs.get(partner)?.[0] !== id) {
      return { ok: false, matching: empty, reason: "final table is not symmetric" };
    }
    matching.set(id, partner);
  }

  return { ok: true, matching };
}

/**
 * Fallback: greedy maximum-weight matching. Sort every viable pair by score
 * and take them highest-first, skipping anyone already spoken for.
 *
 * Not optimal (Blossom would be), but within a few percent of it in practice
 * and it always returns something, which matters more when a round has to
 * ship on Wednesday.
 */
export function greedyMaxWeight(
  edges: Array<{ a: string; b: string; score: number }>,
): Map<string, string> {
  const taken = new Set<string>();
  const matching = new Map<string, string>();
  const sorted = [...edges].sort((x, y) => y.score - x.score);
  for (const e of sorted) {
    if (taken.has(e.a) || taken.has(e.b)) continue;
    taken.add(e.a);
    taken.add(e.b);
    matching.set(e.a, e.b);
    matching.set(e.b, e.a);
  }
  return matching;
}

/**
 * Count blocking pairs: two people who both prefer each other over whoever
 * they actually got. Zero means the matching is stable.
 */
export function countBlockingPairs(
  matching: Map<string, string>,
  prefs: PrefLists,
): number {
  const ranks = buildRanks(prefs);
  const rankOf = (who: string, other: string | undefined) => {
    if (other === undefined) return Infinity;
    return ranks.get(who)?.get(other) ?? Infinity;
  };
  const people = [...prefs.keys()];
  let blocking = 0;
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const x = people[i];
      const y = people[j];
      const rx = ranks.get(x)?.get(y);
      const ry = ranks.get(y)?.get(x);
      if (rx === undefined || ry === undefined) continue;
      if (rx < rankOf(x, matching.get(x)) && ry < rankOf(y, matching.get(y))) blocking++;
    }
  }
  return blocking;
}
