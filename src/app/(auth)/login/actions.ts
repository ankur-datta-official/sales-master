"use server";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { getPostLoginRedirectPath } from "@/lib/auth/post-login-redirect";
import { isSafeRelativePath } from "@/lib/auth/safe-redirect";
import { fetchProfileByUserId } from "@/lib/profiles/fetch-profile";
import { createClient } from "@/lib/supabase/server";

/**
 * Called after `signInWithPassword` so the session cookie is available on the server.
 */
export async function resolvePostLoginPathAction(nextParam: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return ROUTES.login;
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  const role = resolveAppRole(user, profile);
  const safeNext =
    nextParam && isSafeRelativePath(nextParam) ? nextParam : null;

  return getPostLoginRedirectPath(role, { next: safeNext });
}
