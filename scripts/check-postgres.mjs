/**
 * Verify the shared SQL in src/lib/db.ts is valid Postgres.
 *
 * The app runs SQLite locally and Postgres in production, from one set of
 * statements. That's only safe if the statements are actually portable, and
 * "it worked on SQLite" proves nothing about Postgres. PGlite is real
 * Postgres compiled to WASM, so this catches dialect drift without needing a
 * server, a container, or a connection string.
 *
 *   npm run check:pg
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

// Pull the DDL straight out of db.ts so the two can't drift apart.
const source = readFileSync(new URL("../src/lib/db.ts", import.meta.url), "utf8");
const block = source.slice(source.indexOf("const SCHEMA = ["), source.indexOf("];", source.indexOf("const SCHEMA = [")));
// The DDL is written with a ${T} qualifier that resolves to "crashh." on
// Postgres, so substitute the production value and test the real shape.
const SCHEMA = [...block.matchAll(/`([^`]+)`/g)].map((m) => m[1].replaceAll("${T}", "crashh."));
if (SCHEMA.length === 0) throw new Error("Could not read SCHEMA out of src/lib/db.ts");

const toPg = (sql) => { let n = 0; return sql.replace(/\?/g, () => `$${++n}`); };

const db = new PGlite();
const run = (sql, params = []) => db.query(toPg(sql), params);
let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const version = (await db.query("SELECT version()")).rows[0].version.split(",")[0];
console.log(`${version}\n`);

console.log(`schema (${SCHEMA.length} statements)`);
await db.exec("CREATE SCHEMA IF NOT EXISTS brewed");
for (const statement of SCHEMA) await db.exec(statement);
check("all statements accepted", true);

const now = new Date().toISOString();

console.log("\nstatements used by store.ts");
for (let i = 0; i < 2; i++) {
  await run(
    `INSERT INTO brewed.profiles (id, email, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    ["u1", "a@test.dev", JSON.stringify({ v: i }), now, now],
  );
}
const profiles = await run("SELECT data FROM brewed.profiles WHERE id = ?", ["u1"]);
check("profile upsert is idempotent", profiles.rows.length === 1 && JSON.parse(profiles.rows[0].data).v === 1);

await run(`INSERT INTO brewed.meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, ["roundNumber", "2"]);
check("meta upsert", (await run("SELECT value FROM brewed.meta WHERE key = ?", ["roundNumber"])).rows[0].value === "2");

await run(
  `INSERT INTO brewed.rounds (number, closed_at, chats, held_over, strategy, avg_score) VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT (number) DO NOTHING`,
  [1, now, 3, 1, "greedy-max-weight", 56.13],
);
const agg = (await run("SELECT COUNT(*) AS n, COALESCE(SUM(chats), 0) AS chats FROM brewed.rounds")).rows[0];
check("aggregates coerce cleanly", Number(agg.n) === 1 && Number(agg.chats) === 3, "postgres.js returns these as strings; store.ts wraps them in Number()");

console.log("\nstatements used by auth.ts");
const expires = Date.now() + 600_000;
await run(
  `INSERT INTO brewed.challenges (email, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)
   ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0`,
  ["a@test.dev", "hash", expires],
);
await run("UPDATE brewed.challenges SET attempts = attempts + 1 WHERE email = ?", ["a@test.dev"]);
const challenge = (await run("SELECT expires_at, attempts FROM brewed.challenges WHERE email = ?", ["a@test.dev"])).rows[0];
check("BIGINT expiry survives the round trip", Number(challenge.expires_at) === expires);
check("attempt counter increments", Number(challenge.attempts) === 1);
await run("DELETE FROM brewed.challenges WHERE email = ?", ["a@test.dev"]);
check("challenge is burned after use", (await run("SELECT * FROM brewed.challenges")).rows.length === 0);

console.log("\nstatements used by email.ts");
await run(
  `INSERT INTO brewed.emails (id, to_addr, subject, html, body, sent_at, transport, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ["m1", "a@test.dev", "code", "<p>x</p>", "x", now, "resend", null],
);
const emails = await run("SELECT id, error FROM brewed.emails ORDER BY sent_at DESC LIMIT ?", [5]);
check("outbox read with a bound LIMIT", emails.rows.length === 1 && emails.rows[0].error === null);

await db.close();
console.log(failures === 0 ? "\nPostgres dialect OK" : `\n${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
