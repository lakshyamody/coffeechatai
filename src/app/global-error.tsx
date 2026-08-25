"use client";

/**
 * Last-resort error screen. The one failure worth explaining in detail is a
 * missing database on a read-only host, because the fix is two clicks and the
 * default stack trace tells you none of that.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const needsDatabase =
    error.name === "StorageNotConfiguredError" ||
    /POSTGRES_URL|DATABASE_URL|read-only|ENOENT|SQLITE/i.test(error.message);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f0efdc",
          color: "#0d0c0b",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 18 }}>☕ brewed</div>
          <div
            style={{
              background: "#fff",
              border: "2px solid #0d0c0b",
              borderRadius: 16,
              padding: 26,
              boxShadow: "6px 6px 0 0 #0d0c0b",
            }}
          >
            {needsDatabase ? (
              <>
                <h1 style={{ margin: "0 0 12px", fontSize: 24 }}>
                  This deployment has no database
                </h1>
                <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.6 }}>
                  Brewed stores real accounts, so it needs somewhere durable to put
                  them. Locally it uses a SQLite file, but this host&apos;s
                  filesystem is read-only, so it needs Postgres.
                </p>
                <ol style={{ margin: "0 0 12px", paddingLeft: 20, fontSize: 15, lineHeight: 1.8 }}>
                  <li>Vercel dashboard → <strong>Storage</strong> → create a Neon Postgres database</li>
                  <li>Connect it to this project (that sets <code>POSTGRES_URL</code>)</li>
                  <li>Redeploy</li>
                </ol>
                <p style={{ margin: 0, fontSize: 13, color: "#646446" }}>
                  Any Postgres connection string works — set <code>POSTGRES_URL</code>{" "}
                  or <code>DATABASE_URL</code>. Tables are created on first boot.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ margin: "0 0 12px", fontSize: 24 }}>Something broke</h1>
                <p style={{ margin: "0 0 16px", fontSize: 15, lineHeight: 1.6 }}>
                  {error.message || "An unexpected error occurred."}
                </p>
                <button
                  onClick={reset}
                  style={{
                    background: "#ffcd2a",
                    border: "2px solid #0d0c0b",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
