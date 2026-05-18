import { headers } from "next/headers";

import { ROUTES } from "@/config/routes";

export async function getAppOrigin() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? null;
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function buildAbsoluteAppUrl(path: string) {
  return new URL(path, await getAppOrigin()).toString();
}

export async function buildRecoveryRedirectUrl() {
  const resetPath = encodeURIComponent(ROUTES.resetPassword);
  return buildAbsoluteAppUrl(`${ROUTES.authCallback}?next=${resetPath}`);
}

