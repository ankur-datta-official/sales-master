import { NextResponse } from "next/server";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { getPostLoginRedirectPath } from "@/lib/auth/post-login-redirect";
import { isSafeRelativePath } from "@/lib/auth/safe-redirect";
import { fetchProfileByUserId } from "@/lib/profiles/fetch-profile";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link callback — exchanges `code` for a session cookie.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const safeNext = nextParam && isSafeRelativePath(nextParam) ? nextParam : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const profile = user
        ? await fetchProfileByUserId(supabase, user.id)
        : null;
      const role = user ? resolveAppRole(user, profile) : null;
      const path = getPostLoginRedirectPath(role, { next: safeNext });
      return NextResponse.redirect(new URL(path, url.origin));
    }
  }

  return NextResponse.redirect(new URL(`${ROUTES.login}?error=auth`, url.origin));
}
