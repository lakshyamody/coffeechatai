/**
 * The controlled vocabulary behind the questionnaire.
 *
 * `offers` and `seeks` share one tag space on purpose: the matcher's core
 * signal is "what A can give ∩ what B wants", so both sides must be
 * expressed in the same units.
 */

export interface Tag {
  id: string;
  label: string;
  /** Shown on the offer side of the questionnaire. */
  offerLabel?: string;
  /** Shown on the seek side of the questionnaire. */
  seekLabel?: string;
  emoji: string;
}

export const EXCHANGE_TAGS: Tag[] = [
  {
    id: "career-path",
    label: "Career paths",
    offerLabel: "How I got where I am",
    seekLabel: "How you got where you are",
    emoji: "🧭",
  },
  {
    id: "breaking-in",
    label: "Breaking into the industry",
    offerLabel: "Advice on breaking in",
    seekLabel: "Help breaking in",
    emoji: "🚪",
  },
  {
    id: "referrals",
    label: "Referrals & intros",
    offerLabel: "Referrals at my company",
    seekLabel: "A referral or warm intro",
    emoji: "🤝",
  },
  {
    id: "hiring",
    label: "Hiring",
    offerLabel: "I'm hiring right now",
    seekLabel: "I'm looking for a role",
    emoji: "💼",
  },
  {
    id: "craft",
    label: "Craft & technical depth",
    offerLabel: "Deep technical review",
    seekLabel: "Someone to sharpen my craft",
    emoji: "🛠️",
  },
  {
    id: "product-feedback",
    label: "Product feedback",
    offerLabel: "Honest product feedback",
    seekLabel: "Feedback on what I'm building",
    emoji: "🔍",
  },
  {
    id: "fundraising",
    label: "Fundraising",
    offerLabel: "Fundraising know-how",
    seekLabel: "Help raising",
    emoji: "📈",
  },
  {
    id: "cofounder",
    label: "Co-founder energy",
    offerLabel: "I'm looking for a co-founder",
    seekLabel: "I'm looking for a co-founder",
    emoji: "🧬",
  },
  {
    id: "go-to-market",
    label: "Go-to-market",
    offerLabel: "GTM and first customers",
    seekLabel: "Help finding customers",
    emoji: "🎯",
  },
  {
    id: "management",
    label: "Management & leading teams",
    offerLabel: "Managing people",
    seekLabel: "How to lead a team",
    emoji: "🧑‍🏫",
  },
  {
    id: "research",
    label: "Research directions",
    offerLabel: "Research mentorship",
    seekLabel: "Research guidance",
    emoji: "🔬",
  },
  {
    id: "grad-school",
    label: "Grad school & academia",
    offerLabel: "Grad school advice",
    seekLabel: "Grad school advice",
    emoji: "🎓",
  },
  {
    id: "switching",
    label: "Switching fields",
    offerLabel: "I've made the switch",
    seekLabel: "I want to switch fields",
    emoji: "🔀",
  },
  {
    id: "swap-notes",
    label: "Swapping notes as peers",
    offerLabel: "Notes from the same trenches",
    seekLabel: "Someone in the same trenches",
    emoji: "📓",
  },
  {
    id: "freelance",
    label: "Freelance & consulting",
    offerLabel: "Running a solo practice",
    seekLabel: "Going independent",
    emoji: "🧾",
  },
  {
    id: "just-interesting",
    label: "Good conversation, no agenda",
    offerLabel: "Good conversation, no agenda",
    seekLabel: "Good conversation, no agenda",
    emoji: "☕",
  },
];

export const GOAL_TAGS: Tag[] = [
  { id: "learn", label: "Learn how someone else's world works", emoji: "🔭" },
  { id: "get-hired", label: "Find my next role", emoji: "🎣" },
  { id: "hire", label: "Meet people I might hire", emoji: "🪝" },
  { id: "build", label: "Find people to build with", emoji: "🧱" },
  { id: "mentor", label: "Give back / mentor someone", emoji: "🫱" },
  { id: "raise", label: "Meet investors or get raise-ready", emoji: "💰" },
  { id: "customers", label: "Talk to potential users", emoji: "📣" },
  { id: "relocate", label: "Get to know a new city's scene", emoji: "🧳" },
  { id: "friends", label: "Make actual friends in my field", emoji: "🫂" },
];

export interface TopicTag extends Tag {
  /** Corpus frequency 0..1 — drives IDF weighting. Rare picks matter more. */
  prevalence: number;
}

export const TOPIC_TAGS: TopicTag[] = [
  { id: "ai-research", label: "AI research", emoji: "🧠", prevalence: 0.34 },
  { id: "llm-apps", label: "LLM products", emoji: "💬", prevalence: 0.41 },
  { id: "ml-infra", label: "ML infrastructure", emoji: "🏗️", prevalence: 0.18 },
  { id: "devtools", label: "Developer tools", emoji: "⌨️", prevalence: 0.22 },
  { id: "infra", label: "Distributed systems", emoji: "🕸️", prevalence: 0.16 },
  { id: "security", label: "Security", emoji: "🔐", prevalence: 0.12 },
  { id: "fintech", label: "Fintech", emoji: "🏦", prevalence: 0.19 },
  { id: "health", label: "Health & bio", emoji: "🧬", prevalence: 0.14 },
  { id: "climate", label: "Climate & energy", emoji: "🌱", prevalence: 0.11 },
  { id: "robotics", label: "Robotics", emoji: "🦾", prevalence: 0.08 },
  { id: "hardware", label: "Chips & hardware", emoji: "🔌", prevalence: 0.07 },
  { id: "quantum", label: "Quantum", emoji: "⚛️", prevalence: 0.03 },
  { id: "consumer", label: "Consumer apps", emoji: "📱", prevalence: 0.26 },
  { id: "marketplaces", label: "Marketplaces", emoji: "🛒", prevalence: 0.13 },
  { id: "gaming", label: "Games & interactive", emoji: "🎮", prevalence: 0.09 },
  { id: "design", label: "Design & craft", emoji: "🎨", prevalence: 0.21 },
  { id: "data", label: "Data engineering", emoji: "📊", prevalence: 0.17 },
  { id: "product", label: "Product management", emoji: "🗺️", prevalence: 0.24 },
  { id: "growth", label: "Growth & marketing", emoji: "🚀", prevalence: 0.15 },
  { id: "open-source", label: "Open source", emoji: "🌍", prevalence: 0.13 },
  { id: "policy", label: "Tech policy & ethics", emoji: "⚖️", prevalence: 0.06 },
  { id: "education", label: "Education", emoji: "📚", prevalence: 0.1 },
  { id: "space", label: "Space & aero", emoji: "🛰️", prevalence: 0.05 },
  { id: "creator", label: "Creator economy", emoji: "🎬", prevalence: 0.08 },
];

export const SENIORITY_LABELS = [
  "Student",
  "Early career (0–2 yrs)",
  "Mid-level (3–6 yrs)",
  "Senior (7–12 yrs)",
  "Leadership (12+ yrs)",
] as const;

export const SENIORITY_SHORT = [
  "Student",
  "Early career",
  "Mid-level",
  "Senior",
  "Leadership",
] as const;

export const DIRECTION_OPTIONS = [
  {
    id: "senior",
    label: "Someone ahead of me",
    detail: "A few steps further down the road I'm on.",
    emoji: "⬆️",
  },
  {
    id: "peer",
    label: "Someone at my level",
    detail: "Same trenches, different company. Swap notes.",
    emoji: "↔️",
  },
  {
    id: "junior",
    label: "Someone earlier than me",
    detail: "I'd like to be useful to somebody.",
    emoji: "⬇️",
  },
  {
    id: "any",
    label: "Surprise me",
    detail: "Interesting is interesting. Let the matcher decide.",
    emoji: "🎲",
  },
] as const;

export const tagById = (id: string) =>
  EXCHANGE_TAGS.find((t) => t.id === id) ??
  GOAL_TAGS.find((t) => t.id === id) ??
  TOPIC_TAGS.find((t) => t.id === id);

export const tagLabel = (id: string) => tagById(id)?.label ?? id;
export const topicById = (id: string) => TOPIC_TAGS.find((t) => t.id === id);
