/**
 * Where members come from.
 *
 * Each school is pinned to the metro it actually sits in — a headline and a
 * city shown side by side have to agree. Thin metros are safe here because
 * nobody in a low-density city is generated as in-person-only.
 */

export interface Org {
  name: string;
  /** Metro the org sits in — must match a `name` in cities.ts. */
  city: string;
  kind: "school" | "company" | "accelerator";
  /** Shown in the landing marquee. */
  marquee?: boolean;
}

export const IVY_LEAGUE: Org[] = [
  { name: "Harvard", city: "Boston", kind: "school", marquee: true },
  { name: "Yale", city: "New Haven", kind: "school", marquee: true },
  { name: "Princeton", city: "Princeton", kind: "school", marquee: true },
  { name: "Columbia", city: "New York", kind: "school", marquee: true },
  { name: "UPenn", city: "Philadelphia", kind: "school", marquee: true },
  { name: "Brown", city: "Providence", kind: "school" },
  { name: "Dartmouth", city: "Hanover", kind: "school" },
  { name: "Cornell", city: "Ithaca", kind: "school", marquee: true },
];

export const US_SCHOOLS: Org[] = [
  { name: "Stanford", city: "San Francisco", kind: "school", marquee: true },
  { name: "MIT", city: "Boston", kind: "school", marquee: true },
  { name: "UC Berkeley", city: "San Francisco", kind: "school", marquee: true },
  { name: "Carnegie Mellon", city: "Pittsburgh", kind: "school", marquee: true },
  { name: "Caltech", city: "Los Angeles", kind: "school" },
  { name: "Georgia Tech", city: "Atlanta", kind: "school", marquee: true },
  { name: "UT Austin", city: "Austin", kind: "school" },
  { name: "UIUC", city: "Chicago", kind: "school" },
  { name: "Waterloo", city: "Waterloo", kind: "school", marquee: true },
];

export const SINGAPORE_SCHOOLS: Org[] = [
  { name: "NUS", city: "Singapore", kind: "school", marquee: true },
  { name: "NTU Singapore", city: "Singapore", kind: "school", marquee: true },
  { name: "SMU", city: "Singapore", kind: "school" },
];

export const INDIA_SCHOOLS: Org[] = [
  { name: "IIT Bombay", city: "Mumbai", kind: "school", marquee: true },
  { name: "IIT Delhi", city: "Delhi", kind: "school", marquee: true },
  { name: "IIT Madras", city: "Chennai", kind: "school", marquee: true },
  { name: "IIT Kanpur", city: "Kanpur", kind: "school" },
  { name: "IIT Kharagpur", city: "Kolkata", kind: "school" },
  { name: "IISc Bangalore", city: "Bangalore", kind: "school", marquee: true },
  { name: "IIIT Hyderabad", city: "Hyderabad", kind: "school", marquee: true },
  { name: "BITS Pilani", city: "Pilani", kind: "school", marquee: true },
  { name: "NIT Trichy", city: "Chennai", kind: "school" },
  { name: "Ashoka University", city: "Delhi", kind: "school" },
];

export const RESEARCH_LABS: Org[] = [
  { name: "MIT CSAIL", city: "Boston", kind: "school" },
  { name: "Stanford AI Lab", city: "San Francisco", kind: "school" },
  { name: "ETH Zürich", city: "Zürich", kind: "school" },
  { name: "Mila", city: "Montréal", kind: "school" },
  { name: "Alan Turing Institute", city: "London", kind: "school" },
  { name: "A*STAR", city: "Singapore", kind: "school" },
];

export const SCHOOLS: Org[] = [
  ...IVY_LEAGUE,
  ...US_SCHOOLS,
  ...SINGAPORE_SCHOOLS,
  ...INDIA_SCHOOLS,
];

/** YC batches, most recent first — used to stamp founder headlines. */
export const YC_BATCHES = ["W26", "S25", "W25", "S24", "W24", "S23"] as const;

export const ACCELERATORS: Org[] = [
  { name: "Y Combinator", city: "San Francisco", kind: "accelerator", marquee: true },
  { name: "Antler", city: "Singapore", kind: "accelerator" },
  { name: "South Park Commons", city: "San Francisco", kind: "accelerator" },
  { name: "Entrepreneur First", city: "Bangalore", kind: "accelerator" },
];

/** YC-shaped startups — the kind of company that shows up in an SF batch. */
export const YC_STARTUPS: Org[] = [
  { name: "Verdant", city: "San Francisco", kind: "company" },
  { name: "Kestrel AI", city: "San Francisco", kind: "company" },
  { name: "Northbound", city: "San Francisco", kind: "company" },
  { name: "Tessellate", city: "San Francisco", kind: "company" },
  { name: "Muon", city: "San Francisco", kind: "company" },
  { name: "Halcyon", city: "Bangalore", kind: "company" },
  { name: "Otter Labs", city: "Singapore", kind: "company" },
  { name: "Loop", city: "New York", kind: "company" },
];

export const BIG_TECH: Org[] = [
  { name: "Stripe", city: "San Francisco", kind: "company", marquee: true },
  { name: "Figma", city: "San Francisco", kind: "company", marquee: true },
  { name: "Ramp", city: "New York", kind: "company", marquee: true },
  { name: "Datadog", city: "New York", kind: "company", marquee: true },
  { name: "Cloudflare", city: "San Francisco", kind: "company" },
  { name: "Notion", city: "San Francisco", kind: "company" },
  { name: "Linear", city: "San Francisco", kind: "company" },
  { name: "Airbnb", city: "San Francisco", kind: "company" },
  { name: "Anthropic", city: "San Francisco", kind: "company", marquee: true },
  { name: "Razorpay", city: "Bangalore", kind: "company", marquee: true },
  { name: "Sea Group", city: "Singapore", kind: "company" },
  { name: "Grab", city: "Singapore", kind: "company", marquee: true },
  { name: "Zerodha", city: "Bangalore", kind: "company" },
];

export const ALL_ORGS: Org[] = [
  ...SCHOOLS,
  ...RESEARCH_LABS,
  ...ACCELERATORS,
  ...YC_STARTUPS,
  ...BIG_TECH,
];

export const orgByName = (name: string) =>
  ALL_ORGS.find((o) => o.name === name) ??
  ALL_ORGS.find((o) => name.startsWith(o.name));

/** Landing-page marquee — a spread across geographies, not just SF. */
export const MARQUEE_ORGS: string[] = [
  "Y Combinator",
  "Stanford",
  "NUS",
  "IIT Bombay",
  "Harvard",
  "Stripe",
  "IISc Bangalore",
  "MIT",
  "Grab",
  "Cornell",
  "NTU Singapore",
  "Anthropic",
  "IIT Delhi",
  "Figma",
  "UC Berkeley",
  "BITS Pilani",
  "Princeton",
  "Razorpay",
  "IIIT Hyderabad",
  "Waterloo",
  "Carnegie Mellon",
  "IIT Madras",
  "Columbia",
  "Ramp",
  "UPenn",
  "Georgia Tech",
];
