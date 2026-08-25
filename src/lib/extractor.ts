import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import type { Direction, Seniority, StructuredProfile } from "./types";
import { EXCHANGE_TAGS, GOAL_TAGS, TOPIC_TAGS } from "./taxonomy";

/**
 * Profile extraction.
 *
 * Signup asks for two things: whatever they can paste from LinkedIn, and one
 * question — who do you want to meet. Everything the matcher needs is derived
 * from those, including the tag vocabulary it scores on.
 *
 * That mapping is the whole reason this exists. A person writes "I want to
 * talk to people who've scaled a marketplace"; the matcher needs
 * `seeks: ["go-to-market"]`, `topics: ["marketplaces"]`, `direction: "senior"`.
 * Asking someone to tick those boxes themselves was nine screens of work that
 * a model does better from a sentence.
 */

const EXCHANGE_IDS = EXCHANGE_TAGS.map((t) => t.id) as [string, ...string[]];
const GOAL_IDS = GOAL_TAGS.map((t) => t.id) as [string, ...string[]];
const TOPIC_IDS = TOPIC_TAGS.map((t) => t.id) as [string, ...string[]];
const DEAL_BREAKER_IDS = [
  "no-recruiters",
  "no-sales-pitches",
  "no-fundraising-pitches",
  "no-same-company",
  "no-students",
  "no-executives",
] as const;

const OnboardingSchema = z.object({
  name: z.string().describe("Their full name. Empty string if it isn't stated."),
  role: z.string().describe("Job title, e.g. 'Staff engineer'. Best guess from the text."),
  company: z.string().describe("Current employer or company. 'Independent' if unclear."),
  city: z.string().describe("City they're based in. Empty string if not stated."),
  seniority: z
    .number()
    .min(0)
    .max(4)
    .describe("0 student, 1 early career, 2 mid, 3 senior, 4 leadership."),

  offers: z
    .array(z.enum(EXCHANGE_IDS))
    .describe("What this person can credibly give another member, from their background. 2-5 items."),
  seeks: z
    .array(z.enum(EXCHANGE_IDS))
    .describe("What they want from a chat, driven mainly by who they said they want to meet. 1-4 items."),
  topics: z
    .array(z.enum(TOPIC_IDS))
    .describe("Subjects they know or care about. 2-6 items."),
  goals: z
    .array(z.enum(GOAL_IDS))
    .describe("Why they're here. 1-3 items."),

  direction: z
    .enum(["senior", "peer", "junior", "any"])
    .describe("Relative to themselves, who they asked to meet."),
  concreteness: z.number().min(0).max(1).describe("0 open-ended chat, 1 concrete agenda."),
  talkativeness: z.number().min(0).max(1).describe("0 mostly listens, 1 mostly talks."),

  summary: z.string().describe("One sentence, max 25 words, third person: who they are and what they want."),
  values: z.array(z.string()).describe("3-5 short phrases naming what they actually care about."),
  personality: z.object({
    openness: z.number().min(0).max(1),
    energy: z.number().min(0).max(1),
    directness: z.number().min(0).max(1),
    structure: z.number().min(0).max(1),
  }),
  lifestyle: z.array(z.string()).describe("2-4 short phrases about how they work."),
  interests: z.array(z.string()).describe("3-6 specific interests in their own terms."),
  connectionGoals: z.array(z.string()).describe("2-4 phrases: what a good chat looks like for them."),
  dealBreakers: z
    .array(z.enum(DEAL_BREAKER_IDS))
    .describe("Only what they clearly signalled. Empty array if none."),
  preferences: z.array(z.string()).describe("2-4 soft preferences about who they'd click with."),
});

export type Extracted = z.infer<typeof OnboardingSchema>;

export interface ExtractorInput {
  /** Whatever they pasted from their LinkedIn profile. May be empty. */
  linkedinText: string;
  /** Their LinkedIn URL, for reference. */
  linkedinUrl: string;
  /** The one question: who do you want to meet? */
  wantToMeet: string;
  /** Known from verification; used only as a fallback for the display name. */
  email: string;
}

const SYSTEM = `You build structured profiles for a professional coffee-chat matching service.

People are paired 1:1 with one other person a week — for mentorship, swapping notes, finding collaborators, or just meeting someone interesting. This is explicitly NOT dating.

You get two things: text the person copied from their LinkedIn profile, and their answer to "what kind of people do you want to meet?".

From those, produce the full structured profile. In particular:
- "offers" is what THEY can give, inferred from their own experience.
- "seeks" is what they WANT, driven mainly by their answer about who they want to meet.
- "direction" reflects whether they asked for people ahead of them, at their level, earlier than them, or didn't say.

Rules:
- Ground everything in what they actually wrote. Do not invent employers, titles, or achievements.
- If the LinkedIn text is thin, lean on their answer about who they want to meet and keep the rest conservative.
- Personality numbers are estimates from evidence. With little evidence stay near 0.5.
- Only record a deal-breaker they clearly signalled. Lack of enthusiasm is not a deal-breaker.
- Write values, lifestyle, interests and preferences as short human phrases, not sentences.
- Never mention romance, dating, or attraction.`;

function renderInput(input: ExtractorInput): string {
  return [
    `--- Their LinkedIn ---`,
    input.linkedinUrl ? `Profile URL: ${input.linkedinUrl}` : "Profile URL: (not given)",
    input.linkedinText.trim() || "(they pasted nothing)",
    ``,
    `--- Who they want to meet ---`,
    input.wantToMeet.trim() || "(left blank)",
    ``,
    `--- Their email, for a name fallback only ---`,
    input.email,
  ].join("\n");
}

/* ------------------------------------------------------------------------
   Deterministic fallback
   ------------------------------------------------------------------------ */

const KEYWORD_TOPICS: Array<[RegExp, string]> = [
  [/\b(llm|gpt|genai|prompt|agent)\b/i, "llm-apps"],
  [/\b(ml|machine learning|research|paper)\b/i, "ai-research"],
  [/\b(infra|kubernetes|distributed|platform|sre)\b/i, "infra"],
  [/\b(devtool|developer tool|sdk|api|compiler)\b/i, "devtools"],
  [/\b(security|appsec|infosec)\b/i, "security"],
  [/\b(fintech|payments|banking|ledger)\b/i, "fintech"],
  [/\b(health|bio|medical|clinical)\b/i, "health"],
  [/\b(climate|energy|solar|carbon)\b/i, "climate"],
  [/\b(robot|autonom|drone)\b/i, "robotics"],
  [/\b(marketplace|two-sided|supply|demand)\b/i, "marketplaces"],
  [/\b(consumer|mobile app|social)\b/i, "consumer"],
  [/\b(design|ux|ui|product design)\b/i, "design"],
  [/\b(data|analytics|warehouse|pipeline)\b/i, "data"],
  [/\b(product manage|pm\b|roadmap)\b/i, "product"],
  [/\b(growth|marketing|acquisition)\b/i, "growth"],
  [/\b(open source|oss)\b/i, "open-source"],
];

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase() + p.slice(1))
      .join(" ") || "New member"
  );
}

export function heuristicExtract(input: ExtractorInput): Extracted {
  const all = `${input.linkedinText} ${input.wantToMeet}`;
  const topics = [
    ...new Set(KEYWORD_TOPICS.filter(([re]) => re.test(all)).map(([, id]) => id)),
  ].slice(0, 5);

  const wants = input.wantToMeet.toLowerCase();
  const direction: Direction = /senior|experienced|ahead|mentor|veteran|leader/.test(wants)
    ? "senior"
    : /junior|student|earlier|mentee|graduate/.test(wants)
      ? "junior"
      : /peer|same|similar|fellow|other founders/.test(wants)
        ? "peer"
        : "any";

  /**
   * Crude negation check.
   *
   * "not looking to be recruited" contains "recruit", and a bare keyword match
   * read that as *wanting* to be hired — the exact opposite of what the person
   * wrote. Look at the words just before a hit before believing it.
   */
  const negated = (re: RegExp): boolean => {
    const hit = re.exec(wants);
    if (!hit) return false;
    const before = wants.slice(Math.max(0, hit.index - 40), hit.index);
    return /\b(not|no|never|rather not|don'?t|avoid|without|isn'?t|aren'?t)\b[^.]*$/.test(
      before,
    );
  };
  const wantsIt = (re: RegExp) => re.test(wants) && !negated(re);

  const seeks: string[] = [];
  if (wantsIt(/fundrais|investor|raise\b|vc\b/)) seeks.push("fundraising");
  if (wantsIt(/hire|hiring|recruit|new role|a job/)) seeks.push("hiring");
  if (wantsIt(/cofounder|co-founder/)) seeks.push("cofounder");
  if (wantsIt(/market|customer|gtm|go.to.market|growth/)) seeks.push("go-to-market");
  if (wantsIt(/mentor|advice|career|path/)) seeks.push("career-path");
  if (wantsIt(/technical|craft|engineer|architecture/)) seeks.push("craft");
  if (!seeks.length) seeks.push(direction === "peer" ? "swap-notes" : "just-interesting");

  // The same phrasing that must not become a "seek" is a real deal-breaker.
  const dealBreakers: Array<(typeof DEAL_BREAKER_IDS)[number]> = [];
  if (/\b(not|no|never|rather not|don'?t)\b[^.]*\b(recruit|hired|headhunt)/.test(wants)) {
    dealBreakers.push("no-recruiters");
  }
  if (/\b(not|no|never|rather not|don'?t)\b[^.]*\b(pitch|sold|sales)/.test(wants)) {
    dealBreakers.push("no-sales-pitches");
  }

  const seniorityGuess: Seniority = /student|intern|undergrad/i.test(all)
    ? 0
    : /founder|ceo|cto|head of|director|vp|principal/i.test(all)
      ? 3
      : /senior|staff|lead/i.test(all)
        ? 3
        : 2;

  return {
    name: nameFromEmail(input.email),
    role: "",
    company: "Independent",
    city: "",
    seniority: seniorityGuess,
    offers: ["swap-notes", "just-interesting"],
    seeks: seeks.slice(0, 4),
    topics: topics.length ? topics : ["llm-apps", "product"],
    goals: ["learn"],
    direction,
    concreteness: 0.5,
    talkativeness: 0.5,
    summary: `Wants to meet ${input.wantToMeet.trim().slice(0, 90) || "interesting people"}.`,
    values: ["good conversation for its own sake"],
    personality: { openness: 0.5, energy: 0.5, directness: 0.5, structure: 0.5 },
    lifestyle: ["flexible on where they meet"],
    interests: topics,
    connectionGoals: [input.wantToMeet.trim().slice(0, 90) || "meeting someone interesting"],
    dealBreakers,
    preferences: [],
  };
}

/* ------------------------------------------------------------------------
   Providers
   ------------------------------------------------------------------------ */

export type Provider = "gemini" | "claude" | "heuristic";

export function activeProvider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return "heuristic";
}

export function extractorAvailable(): boolean {
  return activeProvider() !== "heuristic";
}

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5";

export function providerLabel(): string {
  switch (activeProvider()) {
    case "gemini":
      return `Google ${GEMINI_MODEL}`;
    case "claude":
      return CLAUDE_MODEL === "claude-opus-5" ? "Claude Opus 5" : CLAUDE_MODEL;
    default:
      return "No model configured";
  }
}

function jsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(OnboardingSchema) as Record<string, unknown>;
  delete schema.$schema;
  const strip = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(strip);
    const obj = node as Record<string, unknown>;
    delete obj.additionalProperties;
    Object.values(obj).forEach(strip);
  };
  strip(schema);
  return schema;
}

async function withGemini(input: ExtractorInput): Promise<Extracted> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: renderInput(input),
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema(),
      temperature: 0.4,
    },
  });
  if (!response.text) throw new Error("Gemini returned no text");
  return OnboardingSchema.parse(JSON.parse(response.text));
}

async function withClaude(input: ExtractorInput): Promise<Extracted> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(OnboardingSchema) },
    messages: [{ role: "user", content: renderInput(input) }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Claude declined (${response.stop_reason})`);
  }
  return response.parsed_output;
}

export interface ExtractionResult {
  fields: Extracted;
  structured: StructuredProfile;
  source: Provider;
}

/**
 * Falls back to the deterministic extractor on a missing key, an API error, a
 * refusal, a quota rejection, or a response that fails validation — signing
 * up must never fail because a model call did.
 */
export async function extractProfile(input: ExtractorInput): Promise<ExtractionResult> {
  const provider = activeProvider();
  let fields: Extracted;
  let source: Provider = provider;

  if (provider === "heuristic") {
    fields = heuristicExtract(input);
  } else {
    try {
      fields = provider === "gemini" ? await withGemini(input) : await withClaude(input);
    } catch (error) {
      console.error(
        `[extractor] ${provider} failed, using deterministic fallback:`,
        error instanceof Error ? error.message : error,
      );
      fields = heuristicExtract(input);
      source = "heuristic";
    }
  }

  const structured: StructuredProfile = {
    summary: fields.summary,
    values: fields.values,
    personality: fields.personality,
    lifestyle: fields.lifestyle,
    interests: fields.interests,
    connectionGoals: fields.connectionGoals,
    dealBreakers: fields.dealBreakers as StructuredProfile["dealBreakers"],
    preferences: fields.preferences,
    source,
    extractedAt: new Date().toISOString(),
  };

  return { fields, structured, source };
}
