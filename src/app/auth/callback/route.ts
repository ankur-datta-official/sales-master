import { NextResponse } from "next/server";

import { ROUTES } from "@/config/routes";
import { isSafeRelativePath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAuthAccessContext, getPostAuthRedirectPath } from "@/modules/auth/access-state";

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
      if (safeNext === ROUTES.resetPassword) {
        return NextResponse.redirect(new URL(ROUTES.resetPassword, url.origin));
      }
      const access = await getCurrentAuthAccessContext();
      const path = getPostAuthRedirectPath(access, safeNext);
      return NextResponse.redirect(new URL(path, url.origin));
    }
  }

  return NextResponse.redirect(new URL(`${ROUTES.login}?error=auth`, url.origin));
}
