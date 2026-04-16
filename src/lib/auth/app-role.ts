import type { User } from "@supabase/supabase-js";

import { isAppRole, type AppRole } from "@/constants/roles";
import type { UserProfile } from "@/types/profile";

/** Authoritative app role from `profiles` only (matches RLS role checks). */
export function resolveAppRole(
  _user: User,
  profile: UserProfile | null
): AppRole | null {
  const fromProfile = profile?.role;
  if (fromProfile && isAppRole(fromProfile)) return fromProfile;
  return null;
}
