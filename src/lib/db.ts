import type { DatabaseSync } from "node:sqlite";

/**
 * Storage, in two dialects.
 *
 *   postgres — used whenever POSTGRES_URL / DATABASE_URL is set. This is the
 *              production path: Vercel's filesystem is read-only, so nothing
 *              on disk can persist there.
 *   sqlite   — the local default, via node:sqlite. No native build, no
 *              service to run.
 *
 * Both speak the same SQL. Queries are written with `?` placeholders and
 * rewritten to `$n` for Postgres, so store.ts holds one set of statements
 * rather than two.
 */

export type Row = Record<string, unknown>;
type Dialect = "postgres" | "sqlite";

const CONNECTION =
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  null;

export const dialect: Dialect = CONNECTION ? "postgres" : "sqlite";

/**
 * Table qualifier.
 *
 * A Supabase project is rarely empty — `profiles` in particular is a table
 * their own starter templates create. Owning a dedicated schema means this
 * app can never collide with, or be confused by, whatever else lives there.
 * SQLite has no schemas, so locally the names stay bare.
 */
export const T = dialect === "postgres" ? "brewed." : "";

interface Handle {
  dialect: Dialect;
  sqlite?: DatabaseSync;
  pg?: import("postgres").Sql;
}

const globalRef = globalThis as unknown as {
  __brewedHandle?: Handle;
  __brewedReady?: Promise<Handle>;
};

/* ------------------------------------------------------------------------
   Schema — written so both engines accept it verbatim.
   ------------------------------------------------------------------------ */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${T}profiles (
     id         TEXT PRIMARY KEY,
     email      TEXT NOT NULL UNIQUE,
     data       TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS ${T}meta (
     key   TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS ${T}challenges (
     email      TEXT PRIMARY KEY,
     code_hash  TEXT NOT NULL,
     expires_at BIGINT NOT NULL,
     attempts   INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS ${T}emails (
     id        TEXT PRIMARY KEY,
     to_addr   TEXT NOT NULL,
     subject   TEXT NOT NULL,
     html      TEXT NOT NULL,
     body      TEXT NOT NULL,
     sent_at   TEXT NOT NULL,
     transport TEXT NOT NULL,
     error     TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS ${T}rounds (
     number    INTEGER PRIMARY KEY,
     closed_at TEXT NOT NULL,
     chats     INTEGER NOT NULL,
     held_over INTEGER NOT NULL,
     strategy  TEXT NOT NULL,
     avg_score DOUBLE PRECISION NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_emails_sent ON ${T}emails (sent_at DESC)`,
];

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "No POSTGRES_URL / DATABASE_URL is set, and this platform has a read-only filesystem, so the local SQLite driver cannot be used.",
    );
    this.name = "StorageNotConfiguredError";
  }
}

/** True on Vercel and anywhere else the disk is not writable. */
const EPHEMERAL_FS = Boolean(process.env.VERCEL);

async function connect(): Promise<Handle> {
  if (dialect === "sqlite" && EPHEMERAL_FS) {
    // Failing loudly here beats an ENOENT from mkdir three frames deep.
    throw new StorageNotConfiguredError();
  }

  if (dialect === "postgres") {
    const { default: postgres } = await import("postgres");
    const pg = postgres(CONNECTION!, {
      // Serverless: one connection per invocation, no prepared-statement
      // cache to trip over behind a transaction pooler.
      // React renders the layout and the page concurrently, so a request
      // routinely has two queries in flight. On a single connection behind a
      // transaction pooler those contend and stall; a small pool lets them
      // proceed independently without meaningfully increasing the number of
      // connections a warm instance holds.
      max: 3,
      // Free-tier poolers have a small client-connection budget, and every
      // warm lambda holds its connections for the whole idle window.
      // Releasing after a few seconds keeps a burst of instances from
      // exhausting the pool and leaving later requests queued behind it.
      idle_timeout: 5,
      max_lifetime: 60 * 5,
      prepare: false,
      ssl: "require",
      connect_timeout: 10,
      // Nothing may hang a request for thirty seconds again: a blocked query
      // now fails fast and surfaces, instead of holding the function open
      // until the platform kills it.
      connection: { statement_timeout: 15000 },
    });

    // Fast path. Once the tables exist — which is every request after the
    // first — this is the only migration cost: one catalog lookup, no DDL,
    // no locks.
    const [marker] = await pg.unsafe(
      "SELECT to_regclass('brewed.meta') IS NOT NULL AS ready",
    );
    if (!marker?.ready) {
      // Deliberately no wrapping transaction. An earlier version held one
      // open across all the DDL with an advisory lock inside it; when a cold
      // lambda was killed mid-migration the backend stayed idle-in-transaction
      // holding ACCESS EXCLUSIVE, and every later request blocked on it.
      // Each statement here is independently idempotent, so a concurrent
      // first boot costs a harmless "already exists" notice and nothing more.
      await pg.unsafe("CREATE SCHEMA IF NOT EXISTS brewed");
      for (const statement of SCHEMA) await pg.unsafe(statement);
    }
    return { dialect, pg };
  }

  const { DatabaseSync } = await import("node:sqlite");
  const { mkdirSync } = await import("node:fs");
  const { dirname, resolve } = await import("node:path");
  const path = resolve(
    process.env.BREWED_DB_PATH ?? resolve(process.cwd(), ".data", "brewed.db"),
  );
  mkdirSync(dirname(path), { recursive: true });
  const sqlite = new DatabaseSync(path);
  sqlite.exec("PRAGMA journal_mode = WAL");
  // SQLite has no DOUBLE PRECISION keyword in older builds; REAL is the
  // portable spelling and node:sqlite accepts both, so the shared DDL stands.
  for (const statement of SCHEMA) sqlite.exec(statement);
  return { dialect, sqlite };
}

async function handle(): Promise<Handle> {
  if (globalRef.__brewedHandle) return globalRef.__brewedHandle;
  if (!globalRef.__brewedReady) {
    globalRef.__brewedReady = connect().then((h) => {
      globalRef.__brewedHandle = h;
      return h;
    });
  }
  return globalRef.__brewedReady;
}

/** `?` → `$1, $2, …` for Postgres; left alone for SQLite. */
function toPgPlaceholders(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const h = await handle();
  if (h.pg) {
    const rows = await h.pg.unsafe(toPgPlaceholders(sql), params as never[]);
    return rows as unknown as T[];
  }
  return h.sqlite!.prepare(sql).all(...(params as never[])) as unknown as T[];
}

export async function queryOne<T = Row>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function exec(sql: string, params: unknown[] = []): Promise<void> {
  const h = await handle();
  if (h.pg) {
    await h.pg.unsafe(toPgPlaceholders(sql), params as never[]);
    return;
  }
  h.sqlite!.prepare(sql).run(...(params as never[]));
}

export async function getMeta(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>(
    `SELECT value FROM ${T}meta WHERE key = ?`,
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await exec(
    `INSERT INTO ${T}meta (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value],
  );
}

/**
 * Can we actually reach storage?
 *
 * Checked once per render in the root layout so a misconfigured deployment
 * shows a page explaining the fix, rather than a 500 with a digest.
 */
let healthyOnce = false;

export async function storageHealthy(): Promise<boolean> {
  // Storage does not become unreachable and then reachable again within the
  // life of one instance in a way this check would help with, and the layout
  // runs it on every single render. Caching the positive result removes a
  // query per request — and removes it from racing the page's own query.
  if (healthyOnce) return true;
  // A cold lambda's first query can be slow enough through a pooler to trip
  // the statement timeout. One slow query is not a missing database, so give
  // it a second attempt before showing the setup screen.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await query("SELECT 1 AS ok");
      healthyOnce = true;
      return true;
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

/** Surfaced in the UI so it's never a guess which engine is live. */
export function storageLabel(): string {
  return dialect === "postgres" ? "Postgres" : "SQLite (local file)";
}
