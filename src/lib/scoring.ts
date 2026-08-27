import type {
  DealBreaker,
  MatchReason,
  Personality,
  Profile,
  ScoreBreakdown,
  ScoreTerm,
} from "./types";
import { TOPIC_TAGS, tagById, tagLabel, topicById } from "./taxonomy";


/**
 * Pair scoring.
 *
 * Five terms, each normalised to 0..1, then blended. The weights encode a
 * point of view about what actually makes a coffee chat good:
 *
 *   reciprocity     .34  — the single biggest predictor. One person has
 *                          something the other one wants, in both directions.
 *   resonance       .24  — enough shared context to skip the small talk.
 *   complementarity .16  — the right amount of asymmetry (seniority, and
 *                          who talks vs. who listens).
 *   logistics       .16  — a chat that never gets scheduled never happened.
 *   serendipity     .10  — deliberately keeps the pool from collapsing into
 *                          echo chambers of identical people.
 */
export const WEIGHTS: Record<ScoreTerm, number> = {
  reciprocity: 0.3,
  resonance: 0.2,
  complementarity: 0.14,
  logistics: 0.14,
  character: 0.14,
  serendipity: 0.08,
};

/** Softened harmonic mean: dominated by the smaller input, but never a hard 0. */
function softHarmonic(a: number, b: number, eps = 0.08): number {
  const x = a + eps;
  const y = b + eps;
  return Math.max(0, (2 * x * y) / (x + y) - eps);
}

const intersect = (a: string[], b: string[]) => a.filter((x) => b.includes(x));

export const SCORE_TERMS: ScoreTerm[] = [
  "reciprocity",
  "resonance",
  "complementarity",
  "logistics",
  "character",
  "serendipity",
];

/** Weighted 0–100 total. Any weight vector; the caller decides whose. */
export function blend(
  parts: Omit<ScoreBreakdown, "total">,
  weights: Record<ScoreTerm, number>,
): number {
  let total = 0;
  for (const term of SCORE_TERMS) total += (weights[term] ?? 0) * parts[term];
  return 100 * total;
}

/** Inverse document frequency — a shared interest in "quantum" beats "LLM products". */
const IDF = new Map<string, number>(
  TOPIC_TAGS.map((t) => [t.id, Math.log(1 / Math.max(t.prevalence, 0.01))]),
);
const GOAL_WEIGHT = 0.9;
const MAX_IDF = Math.max(...IDF.values());

function featureVector(p: Profile): Map<string, number> {
  const v = new Map<string, number>();
  for (const t of p.topics) v.set(`topic:${t}`, IDF.get(t) ?? 1);
  for (const g of p.goals) v.set(`goal:${g}`, GOAL_WEIGHT);
  return v;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, w] of a) {
    na += w * w;
    const bw = b.get(k);
    if (bw !== undefined) dot += w * bw;
  }
  for (const w of b.values()) nb += w * w;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** How much of `wants` can `has` cover? 0..1 */
function coverage(has: string[], wants: string[]): number {
  if (wants.length === 0) return 0.6; // nothing asked for — neutral, not perfect
  return intersect(has, wants).length / wants.length;
}

export function reciprocity(a: Profile, b: Profile): number {
  const forward = coverage(a.offers, b.seeks);
  const backward = coverage(b.offers, a.seeks);
  // A pure harmonic mean is too harsh on the one-sided case, and one-sided
  // is a real, common, good coffee chat: a student asks a staff engineer
  // about their path and has nothing to trade back. Under the old formula
  // someone who offered exactly what you asked for scored 0.07 and lost to a
  // near-stranger with matching hobbies. Blending in the stronger direction
  // keeps balanced pairs on top while letting a genuine one-way fit count.
  let score = 0.3 * Math.max(forward, backward) + 0.7 * softHarmonic(forward, backward);
  // Two people who both signed up with no agenda are a fine pairing.
  if (a.seeks.includes("just-interesting") && b.seeks.includes("just-interesting")) {
    score = Math.max(score, 0.55);
  }
  return Math.min(1, score);
}

export function resonance(a: Profile, b: Profile): number {
  return cosine(featureVector(a), featureVector(b));
}

const DESIRED_GAP: Record<Profile["direction"], number | null> = {
  senior: 1.5,
  peer: 0,
  junior: -1.5,
  any: null,
};

function seniorityFit(a: Profile, b: Profile): number {
  const gap = b.seniority - a.seniority;
  const want = DESIRED_GAP[a.direction];
  if (want === null) {
    // "Surprise me" — mildly prefers a small step in either direction over
    // a carbon copy or a five-level chasm.
    return Math.exp(-Math.pow(Math.abs(gap) - 1, 2) / (2 * 1.8 * 1.8));
  }
  return Math.exp(-Math.pow(gap - want, 2) / (2 * 1.3 * 1.3));
}

export function complementarity(a: Profile, b: Profile): number {
  const senior = softHarmonic(seniorityFit(a, b), seniorityFit(b, a));
  // One talker + one listener beats two of either.
  const talkBalance = 1 - Math.abs(a.talkativeness + b.talkativeness - 1);
  // But they should want the same *kind* of conversation.
  const agendaAlign = 1 - Math.abs(a.concreteness - b.concreteness);
  return 0.55 * senior + 0.25 * talkBalance + 0.2 * agendaAlign;
}

export function logistics(a: Profile, b: Profile): number {
  // Every chat is a video call and a booking link is required at signup, so
  // what's left that predicts whether a chat happens is the clock: a pair
  // twelve hours apart has two bad options, a pair two hours apart has an
  // easy overlap. The booking term only matters for members who joined
  // before links were mandatory.
  const tzGap = Math.abs(a.utcOffset - b.utcOffset);
  const timezone = Math.exp(-(tzGap * tzGap) / 50);

  const links = [a.calendlyUrl, b.calendlyUrl].filter(Boolean).length;
  const booking = links === 2 ? 1 : links === 1 ? 0.7 : 0.4;

  return Math.min(1, 0.65 * timezone + 0.35 * booking);
}

export function serendipity(a: Profile, b: Profile): number {
  const all = new Set([...a.topics, ...b.topics]);
  const shared = intersect(a.topics, b.topics).length;
  const jaccard = all.size === 0 ? 0 : shared / all.size;
  // Concave: peaks at 50% overlap. Enough in common to talk, enough
  // different to learn something.
  const overlapCurve = 4 * jaccard * (1 - jaccard);
  const differentCompany = a.company !== b.company ? 0.15 : 0;
  const differentCity = a.city !== b.city ? 0.1 : 0;
  return Math.min(1, 0.75 * overlapCurve + differentCompany + differentCity);
}


/* ------------------------------------------------------------------------
   Character — from the structured representation
   ------------------------------------------------------------------------ */

/** Token-level overlap, since these phrases are free text, not tag ids. */
function phraseOverlap(a: string[], b: string[]): number {
  const tokens = (xs: string[]) =>
    new Set(
      xs
        .join(" ")
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .filter((w) => w.length > 3),
    );
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.min(ta.size, tb.size);
}

function personalityFit(a: Personality, b: Personality): number {
  // Curiosity should roughly match — a novelty-chaser paired with someone
  // who wants the known is a frustrating hour for both.
  const openness = 1 - Math.abs(a.openness - b.openness);
  // Two very blunt people or two very indirect ones both misfire, but the
  // penalty for mismatch is milder than for the other traits.
  const directness = 1 - Math.abs(a.directness - b.directness) * 0.7;
  // Wanting the same *kind* of conversation matters a lot.
  const structure = 1 - Math.abs(a.structure - b.structure);
  // Energy is the one trait where a little difference helps.
  const energy = 1 - Math.abs(Math.abs(a.energy - b.energy) - 0.25) / 0.75;
  return Math.max(
    0,
    0.3 * openness + 0.2 * directness + 0.3 * structure + 0.2 * energy,
  );
}

export function character(a: Profile, b: Profile): number {
  const sa = a.structured;
  const sb = b.structured;
  // No structured representation yet means no opinion, not a bad one.
  if (!sa || !sb) return 0.5;
  const values = phraseOverlap(sa.values, sb.values);
  const interests = phraseOverlap(sa.interests, sb.interests);
  const fit = personalityFit(sa.personality, sb.personality);
  return Math.min(1, 0.3 * values + 0.15 * interests + 0.55 * fit);
}

/**
 * Deal-breakers are hard. They delete the edge rather than lowering it, so
 * no amount of compatibility elsewhere can route around them.
 */
function violatesDealBreaker(viewer: Profile, other: Profile): DealBreaker | null {
  for (const db of viewer.structured?.dealBreakers ?? []) {
    switch (db) {
      case "no-recruiters":
        if (other.goals.includes("hire")) return db;
        break;
      case "no-sales-pitches":
        if (other.goals.includes("customers")) return db;
        break;
      case "no-fundraising-pitches":
        if (other.goals.includes("raise")) return db;
        break;
      case "no-same-company":
        if (other.company === viewer.company) return db;
        break;
      case "no-students":
        if (other.seniority === 0) return db;
        break;
      case "no-executives":
        if (other.seniority === 4) return db;
        break;
    }
  }
  return null;
}

export function dealBreakerBetween(a: Profile, b: Profile): DealBreaker | null {
  return violatesDealBreaker(a, b) ?? violatesDealBreaker(b, a);
}

/**
 * Full pair score. Returns null when the pair is structurally impossible —
 * these edges never enter the assignment graph at all.
 */
export function scorePair(a: Profile, b: Profile): ScoreBreakdown | null {
  if (a.id === b.id) return null;
  if (a.blocked.includes(b.id) || b.blocked.includes(a.id)) return null;
  if (a.history.includes(b.id) || b.history.includes(a.id)) return null;
  if (dealBreakerBetween(a, b)) return null;

  const parts = {
    reciprocity: reciprocity(a, b),
    resonance: resonance(a, b),
    complementarity: complementarity(a, b),
    logistics: logistics(a, b),
    character: character(a, b),
    serendipity: serendipity(a, b),
  };

  return { ...parts, total: blend(parts, WEIGHTS) };
}

/**
 * Human-readable "why you two" — derived from the score terms that actually
 * fired, so the explanation can never disagree with the ranking.
 */
/**
 * Whose eyes the explanation is written for.
 *
 * "second-person" addresses `a` directly ("you offered it") and is what the
 * matched person reads. "neutral" names both people and is what an observer
 * reads — the lab lists every pairing in the round, and telling a bystander
 * that *they* offered something is simply false.
 */
export type Pov = "second-person" | "neutral";

export function explain(
  a: Profile,
  b: Profile,
  s: ScoreBreakdown,
  pov: Pov = "second-person",
): MatchReason[] {
  const reasons: MatchReason[] = [];
  /** A term only earns a sentence if the number behind it is real. */
  const fired = (term: keyof ScoreBreakdown, floor: number) => s[term] >= floor;
  const second = pov === "second-person";

  // "No agenda" is a real answer, but it reads badly inside a sentence about
  // what someone asked for, so it never gets picked as the headline exchange.
  const NO_AGENDA = "just-interesting";
  const meaningful = (ids: string[]) => ids.filter((t) => t !== NO_AGENDA);
  const aGives = meaningful(intersect(a.offers, b.seeks));
  const bGives = meaningful(intersect(b.offers, a.seeks));
  const bothOpen = a.seeks.includes(NO_AGENDA) && b.seeks.includes(NO_AGENDA);

  // Everything here is written from `a`'s point of view — `a` is whoever is
  // reading it, so they are "you", never their own first name.
  const firstName = (p: Profile) => p.name.split(" ")[0];
  const who = (p: Profile) => (second && p.id === a.id ? "You" : firstName(p));
  const whom = (p: Profile) => (second && p.id === a.id ? "you" : firstName(p));
  const A = firstName(a);
  const B = firstName(b);

  if (!fired("reciprocity", 0.25)) {
    // nothing worth claiming here
  } else if (aGives.length && bGives.length) {
    reasons.push({
      kind: "reciprocity",
      label: "You each have what the other asked for",
      detail: second
        ? `${B} asked for ${tagLabel(aGives[0]).toLowerCase()} and you offered it. You asked for ${tagLabel(bGives[0]).toLowerCase()} — that's on their list.`
        : `${B} asked for ${tagLabel(aGives[0]).toLowerCase()} and ${A} offered it. ${A} asked for ${tagLabel(bGives[0]).toLowerCase()} — that's on ${B}'s list.`,
    });
  } else if (aGives.length || bGives.length) {
    const give = aGives[0] ?? bGives[0];
    const giver = aGives.length ? a : b;
    const taker = aGives.length ? b : a;
    reasons.push({
      kind: "reciprocity",
      label: "There's a clear thing to talk about",
      detail: `${who(taker)} asked for ${tagLabel(give).toLowerCase()}, and ${whom(giver)} put it on the table.`,
    });
  } else if (bothOpen) {
    reasons.push({
      kind: "reciprocity",
      label: second ? "Neither of you came with an agenda" : "Neither came with an agenda",
      detail: `${second ? "You both" : "Both"} signed up for the conversation rather than a favour. Those tend to be the good ones.`,
    });
  }

  const sharedTopics = intersect(a.topics, b.topics);
  if (sharedTopics.length && fired("resonance", 0.2)) {
    const rarest = sharedTopics
      .map((t) => ({ t, idf: IDF.get(t) ?? 0 }))
      .sort((x, y) => y.idf - x.idf)[0];
    const rare = rarest.idf > MAX_IDF * 0.55;
    reasons.push({
      kind: "resonance",
      label: rare ? "A rare thing in common" : "Shared ground",
      detail: rare
        ? `${second ? "You both" : "Both"} care about ${tagLabel(rarest.t).toLowerCase()} — only a sliver of the pool picked that.`
        : `${second ? "Both of you are" : "Both are"} deep in ${sharedTopics.slice(0, 2).map((t) => tagLabel(t).toLowerCase()).join(" and ")}.`,
    });
  }

  const gap = b.seniority - a.seniority;
  if (Math.abs(gap) >= 1 && s.complementarity > 0.5) {
    reasons.push({
      kind: "complementarity",
      label: second
        ? gap > 0
          ? "They're a few steps ahead"
          : "You're a few steps ahead"
        : `${gap > 0 ? B : A} is a few steps ahead`,
      detail:
        gap > 0
          ? `${B} has walked the road ${second ? "you're" : `${A} is`} on — close enough that the advice still applies.`
          : `${second ? "You've" : `${A} has`} walked the road ${B} is on. That's exactly what they asked for.`,
    });
  }

  if (fired("logistics", 0.55)) {
    const bothBook = Boolean(a.calendlyUrl && b.calendlyUrl);
    const tzGap = Math.abs(a.utcOffset - b.utcOffset);
    reasons.push({
      kind: "logistics",
      label: bothBook ? "Easy to book" : "Workable hours",
      detail: bothBook
        ? `${tzGap === 0 ? "Same timezone" : `${tzGap} hours apart`}, and you both have a booking link — one click, no scheduling thread.`
        : `${tzGap === 0 ? "Same timezone" : `Only ${tzGap} hours apart`}, so finding an hour is straightforward.`,
    });
  }

  if (s.serendipity > 0.6) {
    reasons.push({
      kind: "serendipity",
      label: "Different enough to be interesting",
      detail: `${second ? "You" : "They"} overlap enough to have a conversation and differ enough that it won't be an echo.`,
    });
  }

  // A weak pair should read as a weak pair rather than borrowing the
  // language of a strong one.
  if (reasons.length === 0) {
    reasons.push({
      kind: "logistics",
      label: "A thin week in the pool",
      detail: `Nothing lined up strongly, so we went with the best of what was left. ${second ? "Rewrite your answer and next round" : "A different answer"} has more to work with.`,
    });
  }

  return reasons.slice(0, 4);
}

/** Conversation starters, built from the same overlap the score used. */
export function starters(a: Profile, b: Profile): string[] {
  const out: string[] = [];
  const notOpen = (ids: string[]) => ids.filter((t) => t !== "just-interesting");
  const bGives = notOpen(intersect(b.offers, a.seeks));
  const aGives = notOpen(intersect(a.offers, b.seeks));
  const sharedTopics = intersect(a.topics, b.topics);

  if (bGives.length) {
    const t = tagById(bGives[0]);
    out.push(`Ask ${b.name.split(" ")[0]} about ${(t?.label ?? bGives[0]).toLowerCase()} — they put it on the table.`);
  }
  if (sharedTopics.length) {
    // Lead with the rarest shared topic, same as the explanation does — two
    // different "you both picked X" claims on one page reads like a bug.
    const rarest = sharedTopics
      .map((t) => ({ t, idf: IDF.get(t) ?? 0 }))
      .sort((x, y) => y.idf - x.idf)[0].t;
    const t = topicById(rarest);
    out.push(`You both picked ${t?.label ?? rarest}. Compare what you each got wrong about it first.`);
  }
  if (b.seniority > a.seniority) {
    out.push(`"What would you do differently if you were where I am now?"`);
  } else if (b.seniority < a.seniority) {
    out.push(`"What's the thing nobody's explaining well to you right now?"`);
  } else {
    out.push(`"What's the least-solved problem on your desk this month?"`);
  }
  if (aGives.length) {
    out.push(`They're hoping you'll cover ${tagLabel(aGives[0]).toLowerCase()} — you offered it.`);
  }
  out.push(`Trade one thing you've each changed your mind about this year.`);
  return out.slice(0, 4);
}
