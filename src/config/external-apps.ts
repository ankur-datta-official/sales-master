/**
 * Cross-product handoff targets used from the Sales Master auth surfaces.
 *
 * The external CRM owns post-navigation auth behavior. We intentionally send
 * users to its dashboard URL and let that app decide dashboard vs auth flow.
 */
export const EXTERNAL_CRM = {
  workspaceUrl: "https://crm.mugnee.com/dashboard",
  signupFallbackUrl:
    "https://crm.mugnee.com/auth/register?next=%2Fonboarding%2Fworkspace",
  ctaLabel: "Open CRM Workspace",
  helperText:
    "Continue to the CRM workspace. If you're already signed in there, you'll land on its dashboard.",
} as const;
