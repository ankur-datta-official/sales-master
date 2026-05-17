import type { RoleDashboardVariant } from "@/lib/auth/role-presentation";

export type DashboardLayoutFamily = "leadership" | "marketer" | "accounts" | "delivery";

export type DashboardLayoutSpec = {
  family: DashboardLayoutFamily;
  expectedSectionCount: number;
  primaryCtaLabel: string;
};

const LAYOUT_SPEC: Record<RoleDashboardVariant, DashboardLayoutSpec> = {
  ceo: {
    family: "leadership",
    expectedSectionCount: 5,
    primaryCtaLabel: "Export Executive Report",
  },
  head_of_sales: {
    family: "leadership",
    expectedSectionCount: 5,
    primaryCtaLabel: "Export Leadership Report",
  },
  division_manager: {
    family: "leadership",
    expectedSectionCount: 5,
    primaryCtaLabel: "View Division Report",
  },
  zone_manager: {
    family: "leadership",
    expectedSectionCount: 5,
    primaryCtaLabel: "View Zone Report",
  },
  marketer: {
    family: "marketer",
    expectedSectionCount: 3,
    primaryCtaLabel: "View Full Report",
  },
  accounts: {
    family: "accounts",
    expectedSectionCount: 3,
    primaryCtaLabel: "Export Accounts Report",
  },
  delivery: {
    family: "delivery",
    expectedSectionCount: 3,
    primaryCtaLabel: "Export Delivery Report",
  },
  workspace: {
    family: "leadership",
    expectedSectionCount: 3,
    primaryCtaLabel: "Export Report",
  },
};

export function getDashboardLayoutSpec(variant: RoleDashboardVariant): DashboardLayoutSpec {
  return LAYOUT_SPEC[variant];
}
