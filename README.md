# Crashh ☕

A coffee-chat matchmaker — the ditto.ai product model and visual language, rebuilt for
professional networking instead of dating. Tell it who you'd like to meet; every
Wednesday it pairs you with one person worth talking to and tells you why.

Next.js 16 · React 19 · Tailwind v4 · shadcn/ui

```bash
npm install
npm run dev
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page — hero, four-step explainer, proof, matchmaker, comparison, safety, FAQ |
| `/join` | Seven-step onboarding questionnaire, ends with a live preview of your closest matches |
| `/dashboard` | Your match: the poster, why you two, the full score breakdown, a scheduler, conversation starters |
| `/lab` | The round internals — strategy, stats, every pairing, and who was held over |

No account needed to look around: `/dashboard` offers a set of pool members to view as.

## The pipeline

```
   Questionnaire ──┐
                   ├──► LLM Profile Extractor ──► Structured User Representation
  Behavioural data ─┘        (Claude Opus 5)        values · personality · lifestyle
   (ratings, tags,                                  interests · connection goals
    no-shows)                                       deal-breakers · preferences
                                                              │
                                                              ▼
                                              Candidate Generation  (hard filters)
                                                              │
                                                              ▼
                                              Compatibility Scoring (6 terms)
                                                              │
                                                              ▼
                                              Global Matching Layer
                                              Irving's stable roommates,
                                              else greedy + repair + 2-opt
                                                              │
                                                              ▼
                                              Match emails ──► they meet
                                                              │
                                                              ▼
                                                          Feedback
                                                              │
                                                              ▼
                                              Preference Model UPDATE ──┐
                                                                        │
                                              ◄─────────────────────────┘
                                                   next round
```

### 1. Extraction

Members answer a questionnaire *and* write a few sentences in their own words.
`src/lib/extractor.ts` sends both to a model with a schema-constrained
structured output, producing values, a four-trait personality estimate,
lifestyle, interests, connection goals, deal-breakers, and preferences.

Two providers are supported and one zod schema drives both — Gemini consumes
the JSON Schema derived from it, Claude consumes it through `zodOutputFormat`,
and either response is parsed back through zod before it's trusted.
`GEMINI_API_KEY` takes priority; `ANTHROPIC_API_KEY` is used otherwise.

With neither key — or on an API error, a refusal, a quota rejection, or a
schema failure — it falls back to a deterministic rules-based extractor and
says which engine ran, in the UI and on the profile. **A signup never fails
because a model call did.**

### 2. Candidate generation

Cheap structural filters before anything expensive: identity, blocks, prior
matches, deal-breakers, whether they can physically meet, and whether their
calendars intersect at all. Roughly a third of pairs die here.

### 3. Compatibility scoring

| Term | Weight | What it measures |
| --- | --- | --- |
| Reciprocity | 30% | `offers(A) ∩ seeks(B)` and the reverse, via a softened **harmonic mean** so a lopsided pairing can't score well on one side alone |
| Resonance | 20% | **IDF-weighted cosine** over topics and goals — "quantum" counts far more than "LLM products" |
| Complementarity | 14% | Seniority gap vs. what each side asked for, plus talker/listener balance |
| Logistics | 14% | Timezone distance, plus whether both sides have a booking link (all chats are video calls) |
| Character | 14% | Values overlap and personality fit, from the structured representation |
| Serendipity | 8% | `4j(1−j)` over topic Jaccard — peaks at 50% overlap |

**Deal-breakers are hard.** They delete the edge rather than lowering it, so
no amount of compatibility elsewhere can route around them.

### 4. Global matching

Everyone sits in one pool, so this is **stable roommates** — not swiping, and
not the bipartite matching a dating app uses. **Irving's algorithm** (1985)
finds a matching where no two people would both rather have had each other.
Stable roommates instances often have no solution; when that happens the round
falls back to greedy max-weight, then two repair passes and **2-opt** local
search. The fallback never runs over a successful stable matching.

Each person's preference list is ranked by *their own* learned weights — which
is exactly the input stable roommates was designed to consume. The score shown
in the UI stays symmetric and population-weighted, so both people see the same
number.

### 5. Feedback → preference model

Ratings are labelled examples: we already know why the matcher paired you.
`src/lib/preferences.ts` applies a **multiplicative-weights (Hedge /
exponentiated gradient)** update, crediting terms by how much they *stood out*
in that pairing rather than their raw level. Weights are normalised and
clamped so no term collapses or dominates, and blended toward the population
default until there's enough evidence to trust them (full trust at 8 ratings).

In practice: six 5-star ratings on high-character pairings move that member's
character weight from 0.14 to 0.38, with everything else shrinking to match.

## Auth and email

Sign-in is an emailed six-digit code. Codes are stored hashed, expire in 10
minutes, and burn after 5 wrong guesses. Sessions are stateless HMAC tokens,
so a restart doesn't sign everyone out mid-round.

**Sign In with LinkedIn** is offered when `LINKEDIN_CLIENT_ID` and
`LINKEDIN_CLIENT_SECRET` are set — hand-rolled OpenID Connect rather than an
auth library, so LinkedIn's session model doesn't collide with the one already
here. It confirms email and name in a single step, replacing the emailed code.

It does **not** feed the matcher, and the UI says so. LinkedIn's self-serve
OIDC returns `sub`, `name`, `picture`, `email` and nothing else — no headline,
no employer, no history. Reading a real profile requires their partner
programme, which isn't self-serve, so members still paste their profile text.

The button is hidden unless both values are present, so a half-configured
deployment shows the code flow rather than a button that dead-ends.

Passwords are mandatory, and the door branches on the address: a new email
verifies by code, then must set a password before onboarding; an existing
account signs in by password, with the emailed code as the recovery path
(which ends in setting a new password). Hashes are scrypt with per-password
salts. A new member has no profile row until enrolment, so a freshly set
password is parked keyed to the verified address and attached when the row is
created. The lookup that branches the flow does reveal whether an address has
an account — that is inherent to branching on it.

**Email delivery is a hard dependency for the code path.** If the provider
rejects the send — the usual cause being an unverified sending domain, which
restricts delivery to the provider account's own address — the API returns 502
and the UI says so, instead of showing a code box for a code that will never
arrive.

Email addresses are never read from a request body — only from a proven
session or a code just verified — so nobody can enrol under someone else's
address and receive their matches.

Four emails: the verification code, a welcome note carrying the extracted
summary, the Wednesday match (with **the other person's address**, so the two
of them can arrange it directly), and a feedback request.

| | |
| --- | --- |
| **AgentMail** | `AGENTMAIL_API_KEY`. Sends from an AgentMail inbox on their own verified domain, so mail reaches **any** recipient. |
| **Outbox** | No key set. Nothing leaves the machine; every message is recorded and rendered at **`/outbox`**, which is what makes the whole email flow demoable with no credentials. |

Either way `/outbox` is the log, and the transport that carried each message is
shown against it.

Resend was used earlier and has been removed: its shared sender only delivers
to the Resend account owner, so every member except the account holder would
request a sign-in code and silently never receive one. A provider that works
for one address is worse than none, because the failure is invisible.

## Layout

```
src/lib/   types · taxonomy · orgs · cities · scoring · irving · matching
           extractor · preferences · auth · session · email · seed · store
src/components/site/   landing page sections
src/components/app/    login, onboarding, match reveal, feedback, grids
src/app/api/           auth/{request,verify,logout} · enroll · feedback
                       me · round · round/{commit,notify}
```

Configuration is all optional — see `.env.example`. With nothing set the app
runs end to end using the rules-based extractor and the captured outbox.

## Deploying

Live at **https://coffeechatai-phi.vercel.app**.

Vercel's filesystem is read-only, so the SQLite driver can't run there — the
app detects this and serves a setup page rather than a 500. Set `POSTGRES_URL`
(or `DATABASE_URL`) to any Postgres and it comes up; tables are created on
first boot and there is no migration step.

### Notes from wiring this to Supabase

Four things cost real time and are worth knowing up front:

- **Use the pooler host, not the direct one.** `db.<ref>.supabase.co` publishes
  only an AAAA record, and Vercel's functions have no IPv6 egress. The
  reachable host is `aws-0-<region>.pooler.supabase.com:6543`, with the
  username `postgres.<project-ref>`. Transaction pooling is why the driver
  sets `prepare: false`.
- **Percent-encode the password.** Supabase's template is
  `postgresql://postgres:[YOUR-PASSWORD]@…`; a password containing `@` or `#`
  breaks URL parsing unless encoded, and the `[ ]` from the template must go.
- **The app owns a `crashh` schema.** A Supabase project is rarely empty and
  `profiles` is a name their own templates use, so nothing here lives in
  `public`.
- **Size the pool for concurrent renders.** React renders the layout and page
  at the same time, so a request routinely has two queries in flight. On a
  single pooled connection those stall each other; `max: 3` with a short
  `idle_timeout` fixes it without hoarding a free tier's connection budget.

### Checking the Postgres path without a server

The app runs SQLite locally and Postgres in production from one set of SQL
statements, which is only safe if those statements are genuinely portable.

```bash
npm run check:pg
```

runs the real schema and every query the app issues against **Postgres 18
compiled to WASM** (PGlite) — no container, no connection string. It reads the
DDL straight out of `src/lib/db.ts` so the test can't drift from the code.

## Scheduling

Rounds run themselves. `/api/cron/tick` is the only moving part, and it is
**idempotent**: it works out what should have happened by now and does only
the parts that haven't. Running it late, or twice, or on a day when nothing is
due, is harmless — which matters when the side effect is emailing everybody.

- Entries close → solve and **freeze** the pairings, so the match someone is
  emailed on Wednesday is the one the round actually solved on Tuesday night,
  even though the pool keeps changing in between.
- Send time passes → email both halves of every pairing, record the chats in
  each member's history, open the next round.
- A missed close is recovered on the send tick rather than skipping a week.
- On a database that has never ticked, the first run records where we are and
  stops. Without that, every past deadline reads as "due" and a fresh
  deployment emails the whole pool on whatever day it came up.

The schedule lives in `src/lib/schedule.ts`, anchored to an explicit IANA zone
(`BREWED_TIMEZONE`, default `Asia/Kolkata`) — "Tuesday 11:59pm" means nothing
to a pool split across San Francisco, Bangalore and Singapore unless you say
whose Tuesday, so the zone is shown in the UI. Deadlines are computed with
`Intl` rather than a date library, and survive daylight-saving transitions.

Cron wiring and why the UTC expressions look arbitrary: see `CRON.md`.

## Storage

Two dialects behind one interface, chosen by whether `POSTGRES_URL` /
`DATABASE_URL` is set:

- **Postgres** (production) via `postgres.js`.
- **SQLite** (local) via `node:sqlite` — built into Node, so no native build
  step and no service to run. Lives at `.data/brewed.db`, override with
  `BREWED_DB_PATH`.

Queries are written once with `?` placeholders and rewritten to `$n` for
Postgres, so `store.ts` holds one set of statements rather than two. Both hold
profiles, auth challenges, the email log, and closed rounds, and everything
survives a restart.

Profiles are stored as a JSON document keyed by id and email: the shape is read whole and
written whole, so a document column is the honest fit rather than twenty columns nothing
queries apart. Deploying somewhere with an ephemeral filesystem means pointing the driver
at Postgres instead; nothing above `src/lib/store.ts` would change.

## No seed data

There is no demo pool and there are no invented figures. The pool is whoever has actually
signed up, and every number on the landing page is counted from the database at request
time — members, chats arranged, rounds run, mean rating. With an empty database the page
says there is nothing to report rather than filling the space with something flattering.

The mockups in the explainer sections are labelled `example`; the people in them are
invented to show the format and are not presented as members.

## Design

Members come from the Ivy League, Stanford / MIT / Berkeley / CMU, NUS and NTU
Singapore, the IITs, IISc Bangalore, IIIT Hyderabad and BITS Pilani, plus YC
companies (founders carry their batch), Big Tech, and research labs. Each org
is pinned to the metro it actually sits in.

Ported from ditto.ai's tokens — cream `hsl(57 40% 90%)` paper, `--radius: .5rem`, and the
hard-offset "sticker" surfaces — with the dating pink replaced by roasted coffee tones and
the golden CTA kept. Ditto's commercial faces (Argent Pixel, Spencer) are substituted with
Google Fonts equivalents: **Jersey 25** for display, **Rubik** for body, **Caveat** for
script accents.
