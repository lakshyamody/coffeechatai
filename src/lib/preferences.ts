import type {
  BehavioralSignal,
  PreferenceModel,
  Profile,
  ScoreBreakdown,
  ScoreTerm,
} from "./types";
import { SCORE_TERMS, WEIGHTS, blend } from "./scoring";

/**
 * The preference model — the last box in the loop.
 *
 * After a chat, the member rates it. We already know exactly *why* the
 * matcher paired them (the score breakdown), so a rating is a labelled
 * example: "a pairing that scored like this was worth 4/5 to me."
 *
 * The update is multiplicative weights (Hedge / exponentiated gradient):
 * terms that were distinctively high in a well-rated pairing get more
 * weight, terms that were distinctively high in a badly-rated one get less.
 * Weights stay normalised so one member's scores remain comparable to
 * everyone else's, and stay clamped so no term can collapse or take over.
 */

const LEARNING_RATE = 0.4;
const MIN_WEIGHT = 0.03;
const MAX_WEIGHT = 0.55;

export function defaultPreferences(): PreferenceModel {
  return {
    weights: { ...WEIGHTS },
    observations: 0,
    tagAffinity: {},
    updatedAt: new Date().toISOString(),
  };
}

function normalise(weights: Record<ScoreTerm, number>): Record<ScoreTerm, number> {
  const clamped = {} as Record<ScoreTerm, number>;
  for (const t of SCORE_TERMS) {
    clamped[t] = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weights[t] ?? MIN_WEIGHT));
  }
  const sum = SCORE_TERMS.reduce((acc, t) => acc + clamped[t], 0);
  const out = {} as Record<ScoreTerm, number>;
  for (const t of SCORE_TERMS) out[t] = clamped[t] / sum;
  return out;
}

export function updatePreferences(
  current: PreferenceModel | undefined,
  breakdown: ScoreBreakdown,
  rating: number,
  tags: string[] = [],
): PreferenceModel {
  const model = current ?? defaultPreferences();

  // 1..5 → -1..+1. A 3 is genuinely neutral and moves nothing.
  const reward = (Math.min(5, Math.max(1, rating)) - 3) / 2;

  // Credit terms by how much they stood out in *this* pairing, not by their
  // raw level — otherwise a term that's always ~0.5 drifts on every rating.
  const mean =
    SCORE_TERMS.reduce((acc, t) => acc + breakdown[t], 0) / SCORE_TERMS.length;

  const next = {} as Record<ScoreTerm, number>;
  for (const t of SCORE_TERMS) {
    const distinctiveness = breakdown[t] - mean;
    next[t] = model.weights[t] * Math.exp(LEARNING_RATE * reward * distinctiveness);
  }

  const tagAffinity = { ...model.tagAffinity };
  for (const tag of tags) {
    tagAffinity[tag] = (tagAffinity[tag] ?? 0) + reward;
  }

  return {
    weights: normalise(next),
    observations: model.observations + 1,
    tagAffinity,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Whose weights to rank with.
 *
 * Blends the member's learned weights toward the population default based on
 * how much evidence there is — one rating shouldn't rewrite someone's model.
 * Full trust at 8 rated chats.
 */
export function weightsFor(profile: Profile): Record<ScoreTerm, number> {
  const model = profile.preferences;
  if (!model || model.observations === 0) return WEIGHTS;
  const trust = Math.min(1, model.observations / 8);
  const out = {} as Record<ScoreTerm, number>;
  for (const t of SCORE_TERMS) {
    out[t] = WEIGHTS[t] * (1 - trust) + model.weights[t] * trust;
  }
  return out;
}

/**
 * How much *this* member values a pairing, by their own weights.
 *
 * Deliberately asymmetric — `personalTotal(a,b) !== personalTotal(b,a)` —
 * which is exactly right for stable roommates, where the algorithm consumes
 * each person's own ranked preference list. The symmetric `score.total` is
 * what gets displayed, so two people always see the same number.
 */
export function personalTotal(viewer: Profile, breakdown: ScoreBreakdown): number {
  return blend(breakdown, weightsFor(viewer));
}

/** Terms this member has drifted furthest from the default on. */
export function preferenceHighlights(
  profile: Profile,
): Array<{ term: ScoreTerm; delta: number }> {
  const model = profile.preferences;
  if (!model || model.observations === 0) return [];
  return SCORE_TERMS.map((t) => ({ term: t, delta: model.weights[t] - WEIGHTS[t] }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
}

export function recordSignal(profile: Profile, signal: BehavioralSignal): Profile {
  return { ...profile, signals: [...profile.signals, signal] };
}
