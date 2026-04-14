/**
 * Application roles for navigation and app-level authorization helpers.
 * Prefer resolving these from joined role metadata later, with JWT metadata as fallback.
 */
export const APP_ROLES = [
  "admin",
  "hos",
  "manager",
  "assistant_manager",
  "marketer",
  "accounts",
  "factory_operator",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}
