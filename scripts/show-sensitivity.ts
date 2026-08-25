/**
 * Demonstrate that matching is driven by the answers, not by anything fixed.
 *
 * Holds a small pool constant, changes exactly one answer at a time on one
 * person, and prints who they'd be matched with and why. If any of this were
 * hardcoded the right-hand column would never move.
 *
 *   npm run explain:matching
 */
import type { Direction, Format, Profile, Seniority } from "../src/lib/types";
import { rankAgainstPool } from "../src/lib/matching";
import { scorePair, dealBreakerBetween } from "../src/lib/scoring";


let n = 0;
function person(p: Partial<Profile> & { name: string }): Profile {
  n += 1;
  return {
    id: `c${n}`,
    email: `${p.name.toLowerCase().replace(/\W+/g, ".")}@example.com`,
    headline: `${p.role ?? "Engineer"} @ ${p.company ?? "Somewhere"}`,
    role: "Engineer",
    company: "Somewhere",
    seniority: 2 as Seniority,
    city: "Bangalore",
    utcOffset: 5.5,
    format: "either" as Format,
    goals: [],
    offers: [],
    seeks: [],
    topics: [],
    direction: "any" as Direction,
    calendlyUrl: "https://calendly.com/example/30min",
    concreteness: 0.5,
    talkativeness: 0.5,
    history: [],
    blocked: [],
    optedIn: true,
    joinedAt: "2026-08-01T00:00:00.000Z",
    avatarSeed: n * 7,
    signals: [],
    emailVerified: true,
    ...p,
  } as Profile;
}

// A deliberately varied pool, held constant across every experiment.
const POOL: Profile[] = [
  person({
    name: "Rhea the investor", role: "Partner", company: "Kestrel Capital",
    seniority: 4, goals: ["hire"], offers: ["fundraising", "go-to-market"],
    seeks: ["swap-notes"], topics: ["marketplaces", "consumer"],
    direction: "junior",
  }),
  person({
    name: "Sam the staff eng", role: "Staff engineer", company: "Stripe",
    seniority: 3, goals: ["mentor"], offers: ["craft", "referrals"],
    seeks: ["management"], topics: ["infra", "devtools"],
    direction: "junior",
  }),
  person({
    name: "Priya the peer founder", role: "Co-founder", company: "Muon",
    seniority: 2, goals: ["build"], offers: ["swap-notes", "product-feedback"],
    seeks: ["swap-notes", "cofounder"], topics: ["llm-apps", "marketplaces"],
    direction: "peer",
  }),
  person({
    name: "Dev the student", role: "CS senior", company: "IIT Delhi",
    seniority: 0, goals: ["learn"], offers: ["swap-notes"],
    seeks: ["career-path", "breaking-in"], topics: ["llm-apps", "devtools"],
    direction: "senior",
  }),
  person({
    name: "Mei the design lead", role: "Head of Design", company: "Figma",
    seniority: 3, goals: ["mentor"], offers: ["craft", "management"],
    seeks: ["product-feedback"], topics: ["design", "consumer"],
    direction: "any",
  }),
  person({
    name: "Omar in Berlin", role: "Engineering manager", company: "Loop",
    seniority: 3, city: "Berlin", utcOffset: 1, format: "in-person",
    goals: ["hire"], offers: ["management", "hiring"], seeks: ["craft"],
    topics: ["infra", "product"], direction: "peer",
  }),
];

const BASE: Profile = person({
  name: "You", role: "Founder", company: "Brewed", seniority: 2,
  goals: ["build"], offers: ["product-feedback", "cofounder"],
  seeks: ["swap-notes"], topics: ["llm-apps", "marketplaces"],
  direction: "peer",
});

function report(label: string, change: Partial<Profile>) {
  const me = { ...BASE, ...change } as Profile;
  const ranked = rankAgainstPool(me, POOL, 3);
  const excluded = POOL.filter((p) => dealBreakerBetween(me, p) || !scorePair(me, p));
  const top = ranked[0];
  console.log(`\n${label}`);
  console.log(
    `  top match : ${top ? `${top.profile.name.padEnd(24)} ${Math.round(top.score.total)}` : "(nobody viable)"}`,
  );
  if (ranked[1]) {
    console.log(`  runner-up : ${ranked[1].profile.name.padEnd(24)} ${Math.round(ranked[1].score.total)}`);
  }
  if (top) {
    const s = top.score;
    console.log(
      `  because   : recip ${s.reciprocity.toFixed(2)}  reson ${s.resonance.toFixed(2)}  compl ${s.complementarity.toFixed(2)}  logis ${s.logistics.toFixed(2)}  charac ${s.character.toFixed(2)}`,
    );
  }
  if (excluded.length) {
    console.log(`  excluded  : ${excluded.map((p) => p.name.split(" ")[0]).join(", ")}`);
  }
}

console.log("Same pool of 6 people every time. One answer changes per row.");
console.log("=".repeat(78));

report("BASELINE — peer founder, wants to swap notes", {});
report('SEEKS "fundraising" instead of "swap-notes"', { seeks: ["fundraising"] });
report('SEEKS "career paths" instead', { seeks: ["career-path"] });
report('WANTS SOMEONE AHEAD (direction: senior)', { direction: "senior" });
report("WANTS SOMEONE EARLIER (direction: junior)", { direction: "junior" });
report('TOPICS become design + consumer', { topics: ["design", "consumer"] });
report("NO BOOKING LINK (others have one)", { calendlyUrl: undefined });
report("IN-PERSON ONLY, IN BERLIN", { city: "Berlin", utcOffset: 1, format: "in-person" });
report("HARD NO on recruiters", {
  structured: {
    summary: "", values: [], lifestyle: [], interests: [], connectionGoals: [],
    preferences: [], personality: { openness: 0.5, energy: 0.5, directness: 0.5, structure: 0.5 },
    dealBreakers: ["no-recruiters"], source: "heuristic", extractedAt: "",
  },
});
report("HARD NO on recruiters AND students", {
  structured: {
    summary: "", values: [], lifestyle: [], interests: [], connectionGoals: [],
    preferences: [], personality: { openness: 0.5, energy: 0.5, directness: 0.5, structure: 0.5 },
    dealBreakers: ["no-recruiters", "no-students"], source: "heuristic", extractedAt: "",
  },
});

console.log("\n" + "=".repeat(78));
console.log("Every row above is the same code path the live round uses.");
