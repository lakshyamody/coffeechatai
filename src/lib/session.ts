import { cookies } from "next/headers";
import { SESSION_COOKIE, readSession } from "./auth";
import { getProfile } from "./store";
import type { Profile } from "./types";

/** The signed-in member, or null. */
export async function currentProfile(): Promise<Profile | null> {
  const id = await requireProfileId();
  return id ? await getProfile(id) : null;
}

export async function requireProfileId(): Promise<string | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}
