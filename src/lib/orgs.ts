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
  /** Primary web domain — where the marquee fetches the org's logo from. */
  domain?: string;
}

export const IVY_LEAGUE: Org[] = [
  { name: "Harvard", city: "Boston", kind: "school", marquee: true, domain: "harvard.edu" },
  { name: "Yale", city: "New Haven", kind: "school", marquee: true, domain: "yale.edu" },
  { name: "Princeton", city: "Princeton", kind: "school", marquee: true, domain: "princeton.edu" },
  { name: "Columbia", city: "New York", kind: "school", marquee: true, domain: "columbia.edu" },
  { name: "UPenn", city: "Philadelphia", kind: "school", marquee: true, domain: "upenn.edu" },
  { name: "Brown", city: "Providence", kind: "school", domain: "brown.edu" },
  { name: "Dartmouth", city: "Hanover", kind: "school", domain: "dartmouth.edu" },
  { name: "Cornell", city: "Ithaca", kind: "school", marquee: true, domain: "cornell.edu" },
];

export const US_SCHOOLS: Org[] = [
  { name: "Stanford", city: "San Francisco", kind: "school", marquee: true, domain: "stanford.edu" },
  { name: "MIT", city: "Boston", kind: "school", marquee: true, domain: "mit.edu" },
  { name: "UC Berkeley", city: "San Francisco", kind: "school", marquee: true, domain: "berkeley.edu" },
  { name: "Carnegie Mellon", city: "Pittsburgh", kind: "school", marquee: true, domain: "cmu.edu" },
  { name: "Caltech", city: "Los Angeles", kind: "school", domain: "caltech.edu" },
  { name: "Georgia Tech", city: "Atlanta", kind: "school", marquee: true, domain: "gatech.edu" },
  { name: "UT Austin", city: "Austin", kind: "school", domain: "utexas.edu" },
  { name: "UIUC", city: "Chicago", kind: "school", domain: "illinois.edu" },
  { name: "Waterloo", city: "Waterloo", kind: "school", marquee: true, domain: "uwaterloo.ca" },
];

export const SINGAPORE_SCHOOLS: Org[] = [
  { name: "NUS", city: "Singapore", kind: "school", marquee: true, domain: "nus.edu.sg" },
  { name: "NTU Singapore", city: "Singapore", kind: "school", marquee: true, domain: "ntu.edu.sg" },
  { name: "SMU", city: "Singapore", kind: "school", domain: "smu.edu.sg" },
];

export const INDIA_SCHOOLS: Org[] = [
  { name: "IIT Bombay", city: "Mumbai", kind: "school", marquee: true, domain: "iitb.ac.in" },
  { name: "IIT Delhi", city: "Delhi", kind: "school", marquee: true, domain: "www.iitd.ac.in" },
  { name: "IIT Madras", city: "Chennai", kind: "school", marquee: true, domain: "www.iitm.ac.in" },
  { name: "IIT Kanpur", city: "Kanpur", kind: "school", domain: "iitk.ac.in" },
  { name: "IIT Kharagpur", city: "Kolkata", kind: "school", domain: "iitkgp.ac.in" },
  { name: "IISc Bangalore", city: "Bangalore", kind: "school", marquee: true, domain: "iisc.ac.in" },
  { name: "IIIT Hyderabad", city: "Hyderabad", kind: "school", marquee: true, domain: "iiit.ac.in" },
  { name: "BITS Pilani", city: "Pilani", kind: "school", marquee: true, domain: "bits-pilani.ac.in" },
  { name: "NIT Trichy", city: "Chennai", kind: "school", domain: "nitt.edu" },
  { name: "Ashoka University", city: "Delhi", kind: "school", domain: "ashoka.edu.in" },
];

export const RESEARCH_LABS: Org[] = [
  { name: "MIT CSAIL", city: "Boston", kind: "school", domain: "csail.mit.edu" },
  { name: "Stanford AI Lab", city: "San Francisco", kind: "school", domain: "ai.stanford.edu" },
  { name: "ETH Zürich", city: "Zürich", kind: "school", domain: "ethz.ch" },
  { name: "Mila", city: "Montréal", kind: "school", domain: "mila.quebec" },
  { name: "Alan Turing Institute", city: "London", kind: "school", domain: "turing.ac.uk" },
  { name: "A*STAR", city: "Singapore", kind: "school", domain: "a-star.edu.sg" },
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
  { name: "Y Combinator", city: "San Francisco", kind: "accelerator", marquee: true, domain: "ycombinator.com" },
  { name: "a16z", city: "San Francisco", kind: "accelerator", marquee: true, domain: "a16z.com" },
  { name: "Afore Capital", city: "San Francisco", kind: "accelerator", marquee: true, domain: "afore.vc" },
  { name: "Antler", city: "Singapore", kind: "accelerator", domain: "antler.co" },
  { name: "South Park Commons", city: "San Francisco", kind: "accelerator", domain: "southparkcommons.com" },
  { name: "Entrepreneur First", city: "Bangalore", kind: "accelerator", domain: "joinef.com" },
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
  { name: "Stripe", city: "San Francisco", kind: "company", marquee: true, domain: "stripe.com" },
  { name: "Figma", city: "San Francisco", kind: "company", marquee: true, domain: "figma.com" },
  { name: "Ramp", city: "New York", kind: "company", marquee: true, domain: "ramp.com" },
  { name: "Datadog", city: "New York", kind: "company", marquee: true, domain: "datadoghq.com" },
  { name: "Cloudflare", city: "San Francisco", kind: "company", domain: "cloudflare.com" },
  { name: "Notion", city: "San Francisco", kind: "company", domain: "notion.so" },
  { name: "Linear", city: "San Francisco", kind: "company", domain: "linear.app" },
  { name: "Airbnb", city: "San Francisco", kind: "company", domain: "airbnb.com" },
  { name: "Anthropic", city: "San Francisco", kind: "company", marquee: true, domain: "anthropic.com" },
  { name: "Razorpay", city: "Bangalore", kind: "company", marquee: true, domain: "razorpay.com" },
  { name: "Sea Group", city: "Singapore", kind: "company", domain: "sea.com" },
  { name: "Grab", city: "Singapore", kind: "company", marquee: true, domain: "grab.com" },
  { name: "Zerodha", city: "Bangalore", kind: "company", domain: "zerodha.com" },
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
const MARQUEE_NAMES = [
  "Y Combinator",
  "a16z",
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
  "Afore Capital",
  "UPenn",
  "Georgia Tech",
];

export interface MarqueeOrg {
  name: string;
  domain?: string;
  /** Local mark — university seals and brand icons, not favicon scraps. */
  logo?: string;
}

const MARQUEE_LOGOS: Record<string, string> = {
  "Y Combinator": "/org-logos/ycombinator.svg",
  a16z: "/org-logos/a16z.png",
  Stanford: "/org-logos/stanford.svg",
  NUS: "/org-logos/nus.svg",
  "IIT Bombay": "/org-logos/iit-bombay.png",
  Harvard: "/org-logos/harvard.png",
  Stripe: "/org-logos/stripe.svg",
  "IISc Bangalore": "/org-logos/iisc.svg",
  MIT: "/org-logos/mit.svg",
  Grab: "/org-logos/grab.svg",
  Cornell: "/org-logos/cornell.svg",
  "NTU Singapore": "/org-logos/ntu.svg",
  Anthropic: "/org-logos/anthropic.svg",
  "IIT Delhi": "/org-logos/iit-delhi.svg",
  Figma: "/org-logos/figma.svg",
  "UC Berkeley": "/org-logos/berkeley.png",
  "BITS Pilani": "/org-logos/bits-pilani.svg",
  Princeton: "/org-logos/princeton.png",
  Razorpay: "/org-logos/razorpay.svg",
  "IIIT Hyderabad": "/org-logos/iiit-hyderabad.png",
  Waterloo: "/org-logos/waterloo.svg",
  "Carnegie Mellon": "/org-logos/cmu.svg",
  "IIT Madras": "/org-logos/iit-madras.svg",
  Columbia: "/org-logos/columbia.png",
  Ramp: "/org-logos/ramp.svg",
  "Afore Capital": "/org-logos/afore.png",
  UPenn: "/org-logos/upenn.png",
  "Georgia Tech": "/org-logos/gatech.svg",
};

export const MARQUEE_ORGS: MarqueeOrg[] = MARQUEE_NAMES.map((name) => ({
  name,
  domain: orgByName(name)?.domain,
  logo: MARQUEE_LOGOS[name],
}));
