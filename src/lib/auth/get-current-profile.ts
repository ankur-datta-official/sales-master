import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileByUserId } from "@/lib/profiles/fetch-profile";
import type { User } from "@supabase/supabase-js";

import type { UserProfile } from "@/types/profile";

export type AuthenticatedSession = {
  user: User;
  profile: UserProfile | null;
};

/**
 * Cached per request — safe to call from multiple Server Components in the same render.
 */
export const getCurrentUserProfile = cache(
  async (): Promise<AuthenticatedSession | null> => {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const profile = await fetchProfileByUserId(supabase, user.id);
    return { user, profile };
  }
);

export async function requireUserProfile(): Promise<AuthenticatedSession> {
  const session = await getCurrentUserProfile();
  if (!session) {
    redirect(ROUTES.login);
  }
  return session;
}
