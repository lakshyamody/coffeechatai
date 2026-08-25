import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Sign In with LinkedIn using OpenID Connect.
 *
 * Hand-rolled rather than pulled from a library: it is three HTTP calls, and
 * owning them keeps LinkedIn's session model from colliding with the HMAC
 * sessions and password login already here.
 *
 * Worth being clear about what this buys. LinkedIn's self-serve OIDC returns
 * name, picture and a verified email — and nothing else. No headline, no
 * employer, no history. Reading an actual profile needs their partner
 * programme, which is not self-serve. So this replaces the email-code step
 * and pre-fills who someone is; it does not feed the matcher, which still
 * needs the profile text they paste.
 */

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export const LINKEDIN_STATE_COOKIE = "brewed_li_state";
export const LINKEDIN_PENDING_COOKIE = "brewed_li_pending";

export function linkedinConfigured(): boolean {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export const redirectUri = (origin: string) => `${origin}/api/auth/linkedin/callback`;

function secret(): string {
  return (
    process.env.BREWED_SESSION_SECRET ??
    "brewed-dev-secret-do-not-use-in-production"
  );
}

/** Signed state, so the callback can prove it started here. */
export function issueState(): string {
  const nonce = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", secret()).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
}

export function validState(value: string | undefined, returned: string | null): boolean {
  if (!value || !returned || value !== returned) return false;
  const [nonce, signature] = value.split(".");
  if (!nonce || !signature) return false;
  const expected = createHmac("sha256", secret()).update(nonce).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function authorizeUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    state,
    scope: "openid profile email",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface LinkedInIdentity {
  sub: string;
  name: string;
  email: string;
  emailVerified: boolean;
  picture?: string;
}

export async function exchangeCode(code: string, origin: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(origin),
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `LinkedIn token exchange failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("LinkedIn returned no access token");
  return data.access_token;
}

export async function fetchIdentity(accessToken: string): Promise<LinkedInIdentity> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(
      `LinkedIn userinfo failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }
  const data = (await response.json()) as {
    sub?: string;
    name?: string;
    email?: string;
    email_verified?: boolean;
    picture?: string;
  };
  if (!data.sub) throw new Error("LinkedIn userinfo returned no subject");
  // email is documented as optional; without it there is no account to key on.
  if (!data.email) {
    throw new Error(
      "LinkedIn didn't share an email address. Sign in with a code instead.",
    );
  }
  return {
    sub: data.sub,
    name: data.name ?? "",
    email: data.email.toLowerCase(),
    emailVerified: data.email_verified !== false,
    picture: data.picture,
  };
}
