import type { User } from "@supabase/supabase-js";

import type { UserProfile } from "@/types/profile";

export function getUserDisplayName(
  profile: UserProfile | null,
  user: User
): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const metaName =
    (typeof meta?.["full_name"] === "string" && meta["full_name"]) ||
    (typeof meta?.["name"] === "string" && meta["name"]) ||
    null;

  return (
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    metaName?.trim() ||
    user.email?.split("@")[0] ||
    "User"
  );
}
