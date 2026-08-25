/**
 * Domain model for Brewed.
 *
 * A member pastes their LinkedIn and answers one question once. Every round
 * (weekly) the matcher takes everyone opted in and produces 1:1 pairings.
 */

export type Seniority = 0 | 1 | 2 | 3 | 4;

/** Who the member wants across the table, relative to themselves. */
export type Direction = "senior" | "peer" | "junior" | "any";

export type Format = "virtual" | "in-person" | "either";

export interface Profile {
  id: string;
  name: string;
  email: string;
  /** e.g. "CS senior @ Waterloo" or "Staff engineer @ Stripe" */
  headline: string;
  role: string;
  company: string;
  seniority: Seniority;
  city: string;
  /** IANA-ish UTC offset in hours, used for virtual overlap scoring. */
  utcOffset: number;
  format: Format;

  /** Tag ids — see taxonomy.ts */
  goals: string[];
  offers: string[];
  seeks: string[];
  topics: string[];

  direction: Direction;
  /** 0 = keep it casual and open-ended, 1 = come with a concrete agenda */
  concreteness: number;
  /** 0 = mostly here to listen, 1 = mostly here to talk */
  talkativeness: number;

  /**
   * Their Calendly (or any booking link). Members schedule with each other
   * directly through this rather than through a calendar we keep a copy of.
   */
  calendlyUrl?: string;

  /** Profile ids this member has already been matched with. */
  history: string[];
  /** Hard excludes — coworkers, exes of the professional variety, etc. */
  blocked: string[];

  optedIn: boolean;
  joinedAt: string;
  avatarSeed: number;

  /** Set once the extractor has run over their answers. */
  structured?: StructuredProfile;
  /** Everything we've observed them do. Append-only. */
  signals: BehavioralSignal[];
  /** Learned scoring weights. Absent until they've rated something. */
  preferences?: PreferenceModel;
  /** Email ownership proven via a one-time code. */
  emailVerified: boolean;
  /** Their LinkedIn, kept so a match can look them up before meeting. */
  linkedinUrl?: string;
  /** OIDC subject, set when they signed in through LinkedIn. */
  linkedinSub?: string;
  /**
   * Optional. `scrypt$salt$hash` once set. Email codes keep working either
   * way — a password only saves the trip to your inbox.
   */
  passwordHash?: string;
}

/* ------------------------------------------------------------------------
   Structured User Representation
   Produced by the profile extractor from the member's LinkedIn text and
   their answer to the one question. This is what the matcher reasons
   over — the raw answers are only ever an input to it.
   ------------------------------------------------------------------------ */

/**
 * Deal-breakers are a closed set on purpose: they become *hard* filters that
 * delete candidate edges, and a free-text hard filter is unenforceable.
 */
export type DealBreaker =
  | "no-recruiters"
  | "no-sales-pitches"
  | "no-fundraising-pitches"
  | "no-same-company"
  | "no-students"
  | "no-executives";

export const DEAL_BREAKERS: Array<{ id: DealBreaker; label: string }> = [
  { id: "no-recruiters", label: "People whose main goal is hiring me" },
  { id: "no-sales-pitches", label: "Anyone selling me something" },
  { id: "no-fundraising-pitches", label: "Fundraising pitches" },
  { id: "no-same-company", label: "Colleagues at my own company" },
  { id: "no-students", label: "Students (I'd rather meet operators)" },
  { id: "no-executives", label: "Execs (I'd rather meet people doing the work)" },
];

export interface Personality {
  /** 0 = sticks to the known, 1 = chases novelty. */
  openness: number;
  /** 0 = reserved, 1 = outgoing. */
  energy: number;
  /** 0 = diplomatic, 1 = blunt. */
  directness: number;
  /** 0 = improvises, 1 = comes with an agenda. */
  structure: number;
}

export interface StructuredProfile {
  /** One line the matcher and the match poster can both use. */
  summary: string;
  values: string[];
  personality: Personality;
  lifestyle: string[];
  interests: string[];
  /** What they want out of a connection — not romantic goals. */
  connectionGoals: string[];
  dealBreakers: DealBreaker[];
  preferences: string[];
  /** Which engine produced this — surfaced in the UI, never guessed at. */
  source: "gemini" | "claude" | "heuristic";
  extractedAt: string;
}

/* ------------------------------------------------------------------------
   Behavioural data + the preference model it trains
   ------------------------------------------------------------------------ */

export type SignalKind =
  | "match-accepted"
  | "match-declined"
  | "chat-completed"
  | "no-show"
  | "rated";

export interface BehavioralSignal {
  kind: SignalKind;
  /** The other person in the pairing this signal is about. */
  pairedWith: string;
  /** 1–5, only on `rated`. */
  rating?: number;
  tags?: string[];
  /** The score breakdown of the pairing being rated — the training input. */
  breakdown?: ScoreBreakdown;
  at: string;
}

export type ScoreTerm = keyof Omit<ScoreBreakdown, "total">;

/**
 * Per-member learned weights over the five scoring terms. Starts at the
 * population default and moves with feedback; always normalised to sum to 1
 * so a member's scores stay comparable to everyone else's.
 */
export interface PreferenceModel {
  weights: Record<ScoreTerm, number>;
  /** How many rated chats have trained this. Low counts are barely trusted. */
  observations: number;
  /** Free-text feedback tags → running affinity, for explanations. */
  tagAffinity: Record<string, number>;
  updatedAt: string;
}

export interface ScoreBreakdown {
  /** Two-way needs fit — the dominant term. 0..1 */
  reciprocity: number;
  /** IDF-weighted cosine over topics + goals. 0..1 */
  resonance: number;
  /** Seniority gap vs. what each side asked for. 0..1 */
  complementarity: number;
  /** How easily this chat can actually be scheduled and held. 0..1 */
  logistics: number;
  /** Shared values and workable personality fit. 0..1 */
  character: number;
  /** Anti-echo-chamber and repeat-pairing control. 0..1 */
  serendipity: number;
  /** Weighted total, 0..100 */
  total: number;
}

export interface MatchReason {
  kind:
    | "reciprocity"
    | "resonance"
    | "complementarity"
    | "logistics"
    | "character"
    | "serendipity";
  label: string;
  detail: string;
}

export interface Pairing {
  a: string;
  b: string;
  score: ScoreBreakdown;
  reasons: MatchReason[];
  /** Their booking links, if either side has one. */
  booking: { a: string | null; b: string | null };
  /** Conversation starters generated from the overlap. */
  starters: string[];
}

export interface RoundResult {
  pairings: Pairing[];
  unmatched: string[];
  /** Which assignment strategy produced the final result. */
  strategy: "stable-roommates" | "greedy-max-weight";
  stats: {
    poolSize: number;
    candidateEdges: number;
    averageScore: number;
    blockingPairs: number;
    elapsedMs: number;
  };
}
