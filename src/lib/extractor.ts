import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import type {
  BehavioralSignal,
  DealBreaker,
  Profile,
  StructuredProfile,
} from "./types";
import { SENIORITY_SHORT, tagLabel } from "./taxonomy";

/* ------------------------------------------------------------------------
   Schema — the contract the model must fill.
   ------------------------------------------------------------------------ */

const DEAL_BREAKER_IDS = [
  "no-recruiters",
  "no-sales-pitches",
  "no-fundraising-pitches",
  "no-same-company",
  "no-students",
  "no-executives",
] as const;

const ExtractedSchema = z.object({
  summary: z
    .string()
    .describe("One sentence, max 25 words, describing who this person is and what they want from a coffee chat. Written in third person."),
  values: z
    .array(z.string())
    .describe("3-5 short phrases naming what this person actually cares about, e.g. 'craft over speed', 'building in public'."),
  personality: z.object({
    openness: z.number().min(0).max(1).describe("0 sticks to the known, 1 chases novelty"),
    energy: z.number().min(0).max(1).describe("0 reserved, 1 outgoing"),
    directness: z.number().min(0).max(1).describe("0 diplomatic, 1 blunt"),
    structure: z.number().min(0).max(1).describe("0 improvises, 1 comes with an agenda"),
  }),
  lifestyle: z
    .array(z.string())
    .describe("2-4 short phrases about how they work and live, e.g. 'nocturnal builder', 'commutes into an office'."),
  interests: z
    .array(z.string())
    .describe("3-6 specific interests, including ones outside work if mentioned."),
  connectionGoals: z
    .array(z.string())
    .describe("2-4 phrases describing what a good outcome of a coffee chat looks like for them."),
  dealBreakers: z
    .array(z.enum(DEAL_BREAKER_IDS))
    .describe("Only include a deal-breaker the person clearly signalled. Empty array if none."),
  preferences: z
    .array(z.string())
    .describe("2-4 soft preferences about who they'd click with."),
});

export type Extracted = z.infer<typeof ExtractedSchema>;

/* ------------------------------------------------------------------------
   Input
   ------------------------------------------------------------------------ */

export interface ExtractorInput {
  name: string;
  role: string;
  company: string;
  city: string;
  seniority: number;
  goals: string[];
  offers: string[];
  seeks: string[];
  topics: string[];
  direction: string;
  format: string;
  concreteness: number;
  talkativeness: number;
  /** Explicit checkbox selections — always trusted over anything inferred. */
  declaredDealBreakers: DealBreaker[];
  /** Free text, in the member's own words. */
  workingOn: string;
  greatChat: string;
  avoid: string;
  /** Behavioural history, so re-extraction can account for what happened. */
  signals?: BehavioralSignal[];
}

const SYSTEM = `You build structured profiles for a professional coffee-chat matching service.

People sign up to be paired 1:1 with one other person a week — for mentorship, swapping notes, finding collaborators, or just meeting someone interesting. This is explicitly NOT dating.

You will be given someone's questionnaire answers and a short piece of free text they wrote themselves. Produce a structured representation of them.

Rules:
- Ground everything in what they actually said. Do not invent biography, employers, or achievements.
- Their own words matter more than their checkbox answers. If the free text contradicts a checkbox, trust the free text and reflect the nuance.
- Personality numbers are estimates from evidence. When there is little evidence, stay near 0.5 rather than guessing extremes.
- Only record a deal-breaker if they clearly signalled it. An absence of enthusiasm is not a deal-breaker.
- Write values, lifestyle, interests, and preferences as short human phrases, not sentences and not marketing copy.
- Never mention romance, dating, or attraction.`;

function renderInput(input: ExtractorInput): string {
  const lines = [
    `Name: ${input.name}`,
    `Role: ${input.role} at ${input.company}`,
    `City: ${input.city}`,
    `Career stage: ${SENIORITY_SHORT[Math.min(4, Math.max(0, input.seniority))]}`,
    `Wants to meet: ${input.direction}`,
    `Meeting format: ${input.format}`,
    ``,
    `Here for: ${input.goals.map(tagLabel).join(", ") || "(not stated)"}`,
    `Can offer: ${input.offers.map(tagLabel).join(", ") || "(not stated)"}`,
    `Looking for: ${input.seeks.map(tagLabel).join(", ") || "(not stated)"}`,
    `Topics: ${input.topics.map(tagLabel).join(", ") || "(not stated)"}`,
    `Self-rated conversation style: ${Math.round(input.concreteness * 100)}/100 toward "concrete agenda"`,
    `Self-rated talkativeness: ${Math.round(input.talkativeness * 100)}/100 toward "mostly talking"`,
    `Declared deal-breakers: ${input.declaredDealBreakers.join(", ") || "(none)"}`,
    ``,
    `--- In their own words ---`,
    `What they're working on: ${input.workingOn || "(left blank)"}`,
    `What would make a great conversation: ${input.greatChat || "(left blank)"}`,
    `What they'd rather avoid: ${input.avoid || "(left blank)"}`,
  ];

  const rated = (input.signals ?? []).filter((s) => s.kind === "rated");
  if (rated.length) {
    lines.push(``, `--- Past chats they rated ---`);
    for (const s of rated.slice(-6)) {
      lines.push(`${s.rating}/5${s.tags?.length ? ` — ${s.tags.join(", ")}` : ""}`);
    }
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------------
   Deterministic fallback
   Runs whenever there's no API key, the call fails, or the model declines.
   Everything downstream depends on a structured profile existing, so this
   path has to produce a usable one rather than throwing.
   ------------------------------------------------------------------------ */

const VALUE_BY_GOAL: Record<string, string> = {
  learn: "learning from people ahead of them",
  "get-hired": "finding the right next room to be in",
  hire: "building a team deliberately",
  build: "making things with other people",
  mentor: "paying it back",
  raise: "getting a company funded",
  customers: "talking to the people they build for",
  relocate: "putting down roots somewhere new",
  friends: "real friendships, not contacts",
};

function keywords(text: string, limit: number): string[] {
  const stop = new Set([
    "the","and","for","with","that","this","from","have","been","about","just",
    "into","what","when","some","more","than","then","they","them","their","would",
    "could","should","really","很","like","want","looking","people","person","work",
    "working","things","stuff","also","much","very","make","making","build",
  ]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.toLowerCase().split(/[^a-z0-9+#.-]+/)) {
    const w = raw.replace(/^[.-]+|[.-]+$/g, "");
    if (w.length < 4 || stop.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= limit) break;
  }
  return out;
}

export function heuristicExtract(input: ExtractorInput): StructuredProfile {
  const values = input.goals
    .map((g) => VALUE_BY_GOAL[g])
    .filter(Boolean)
    .slice(0, 4);
  if (!values.length) values.push("good conversation for its own sake");

  const avoidLower = input.avoid.toLowerCase();
  const inferred: DealBreaker[] = [];
  if (/recruit|hiring me|headhunt/.test(avoidLower)) inferred.push("no-recruiters");
  if (/sales|sell|pitch me|vendor/.test(avoidLower)) inferred.push("no-sales-pitches");
  if (/fundrais|raising|investor pitch/.test(avoidLower)) inferred.push("no-fundraising-pitches");
  if (/colleague|coworker|same company|my company/.test(avoidLower)) inferred.push("no-same-company");
  if (/student/.test(avoidLower)) inferred.push("no-students");
  if (/exec|c-suite|vp\b/.test(avoidLower)) inferred.push("no-executives");

  return {
    summary: `${input.role} at ${input.company} in ${input.city}, looking for ${
      input.seeks.map(tagLabel)[0]?.toLowerCase() ?? "a good conversation"
    }.`,
    values,
    personality: {
      openness: input.topics.length >= 4 ? 0.68 : 0.5,
      energy: input.talkativeness,
      directness: 0.4 + input.concreteness * 0.3,
      structure: input.concreteness,
    },
    lifestyle: [
      input.format === "in-person"
        ? `meets people in ${input.city}`
        : input.format === "virtual"
          ? "works and meets remotely"
          : "flexible on where they meet",
      SENIORITY_SHORT[Math.min(4, Math.max(0, input.seniority))].toLowerCase(),
    ],
    interests: [
      ...input.topics.map(tagLabel),
      ...keywords(`${input.workingOn} ${input.greatChat}`, 3),
    ].slice(0, 6),
    connectionGoals: input.seeks.map(tagLabel).slice(0, 4),
    dealBreakers: [...new Set([...input.declaredDealBreakers, ...inferred])],
    preferences: [
      input.direction === "senior"
        ? "someone further along the same road"
        : input.direction === "junior"
          ? "someone they can be useful to"
          : input.direction === "peer"
            ? "someone in the same trenches"
            : "no strong preference on seniority",
      input.concreteness > 0.6 ? "prefers a concrete agenda" : "happy to let it wander",
    ],
    source: "heuristic",
    extractedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------------
   The extractor
   ------------------------------------------------------------------------ */

export type Provider = "gemini" | "claude" | "heuristic";

/**
 * Whichever provider has a key wins; Gemini first because that's the key this
 * deployment is configured with. With neither, the deterministic extractor
 * runs and says so.
 */
export function activeProvider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return "heuristic";
}

export function extractorAvailable(): boolean {
  return activeProvider() !== "heuristic";
}

/**
 * What is actually running, for display. Read from the same place the
 * extractor reads it, so the site can't claim one provider while another
 * does the work.
 */
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

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5";

/**
 * One zod schema drives both providers: Claude consumes it through
 * `zodOutputFormat`, Gemini through the JSON Schema derived from it. Either
 * way the response is parsed back through zod before it is trusted — Gemini's
 * schema is a strong hint, not a guarantee.
 */
function jsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(ExtractedSchema) as Record<string, unknown>;
  // Gemini rejects these two keys.
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

async function extractWithGemini(input: ExtractorInput): Promise<Extracted> {
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
  const text = response.text;
  if (!text) throw new Error("Gemini returned no text");
  return ExtractedSchema.parse(JSON.parse(text));
}

async function extractWithClaude(input: ExtractorInput): Promise<Extracted> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ExtractedSchema),
    },
    messages: [{ role: "user", content: renderInput(input) }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Claude declined or returned nothing (${response.stop_reason})`);
  }
  return response.parsed_output;
}

/**
 * Turn raw answers into a structured representation.
 *
 * Falls back to the deterministic extractor on a missing key, an API error, a
 * refusal, a quota rejection, or a response that fails schema validation — a
 * signup must never fail because a model call did.
 */
export async function extractProfile(
  input: ExtractorInput,
): Promise<StructuredProfile> {
  const provider = activeProvider();
  if (provider === "heuristic") return heuristicExtract(input);

  try {
    const parsed =
      provider === "gemini"
        ? await extractWithGemini(input)
        : await extractWithClaude(input);

    return {
      ...parsed,
      // A declared deal-breaker is the member's own instruction and is never
      // dropped just because the model didn't repeat it back.
      dealBreakers: [
        ...new Set([...input.declaredDealBreakers, ...parsed.dealBreakers]),
      ],
      source: provider,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[extractor] ${provider} failed, using deterministic fallback:`,
      error instanceof Error ? error.message : error,
    );
    return heuristicExtract(input);
  }
}

/** Re-extract for an existing member, folding in what they've done since. */
export async function reExtract(profile: Profile): Promise<StructuredProfile> {
  return extractProfile({
    name: profile.name,
    role: profile.role,
    company: profile.company,
    city: profile.city,
    seniority: profile.seniority,
    goals: profile.goals,
    offers: profile.offers,
    seeks: profile.seeks,
    topics: profile.topics,
    direction: profile.direction,
    format: profile.format,
    concreteness: profile.concreteness,
    talkativeness: profile.talkativeness,
    declaredDealBreakers: profile.structured?.dealBreakers ?? [],
    workingOn: "",
    greatChat: "",
    avoid: "",
    signals: profile.signals,
  });
}
