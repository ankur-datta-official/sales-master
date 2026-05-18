"use server";

import { ROUTES } from "@/config/routes";
import {
  getCurrentAuthAccessContext,
  getPostAuthRedirectPath,
} from "@/modules/auth/access-state";

/**
 * Called after `signInWithPassword` so the session cookie is available on the server.
 */
export async function resolvePostLoginPathAction(nextParam: string | null) {
  const access = await getCurrentAuthAccessContext();
  if (access.state === "unauthenticated") return ROUTES.login;
  return getPostAuthRedirectPath(access, nextParam);
}
