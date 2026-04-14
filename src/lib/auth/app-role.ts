import type { User } from "@supabase/supabase-js";

import { isAppRole, type AppRole } from "@/constants/roles";
import type { UserProfile } from "@/types/profile";

/** Prefer legacy `profiles.role`, then JWT `app_metadata` / `user_metadata`. */
export function resolveAppRole(
  user: User,
  profile: UserProfile | null
): AppRole | null {
  const fromProfile = profile?.role;
  if (fromProfile && isAppRole(fromProfile)) return fromProfile;

  const fromApp = user.app_metadata?.["role"];
  const fromUser = user.user_metadata?.["role"];
  if (isAppRole(fromApp)) return fromApp;
  if (isAppRole(fromUser)) return fromUser;

  return null;
}
