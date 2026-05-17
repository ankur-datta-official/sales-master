import type { AppRole } from "@/constants/roles";

export type RoleDashboardVariant =
  | "ceo"
  | "head_of_sales"
  | "division_manager"
  | "zone_manager"
  | "marketer"
  | "accounts"
  | "delivery"
  | "workspace";

export type RolePresentation = {
  variant: RoleDashboardVariant;
  title: string;
  shortTitle: string;
  dashboardTitle: string;
  subtitle: string;
  workspaceLabel: string;
};

const ROLE_PRESENTATION: Record<AppRole, RolePresentation> = {
  admin: {
    variant: "ceo",
    title: "Chief Executive Officer",
    shortTitle: "CEO",
    dashboardTitle: "CEO Dashboard",
    subtitle: "Executive overview of company-wide sales, collections, operations, and performance.",
    workspaceLabel: "Executive workspace",
  },
  hos: {
    variant: "head_of_sales",
    title: "Head of Sales",
    shortTitle: "Head of Sales",
    dashboardTitle: "Head of Sales Dashboard",
    subtitle: "Company overview and performance across all divisions and zones.",
    workspaceLabel: "Sales leadership",
  },
  manager: {
    variant: "division_manager",
    title: "Divisional Sales Manager",
    shortTitle: "Divisional Sales Manager",
    dashboardTitle: "Divisional Sales Manager Dashboard",
    subtitle: "Monitor divisional sales, collections, field activity, and team performance.",
    workspaceLabel: "Division workspace",
  },
  assistant_manager: {
    variant: "zone_manager",
    title: "Zonal Sales Manager",
    shortTitle: "Zonal Sales Manager",
    dashboardTitle: "Zonal Sales Manager Dashboard",
    subtitle: "Zone overview, team plans, order status, and marketer performance.",
    workspaceLabel: "Zone workspace",
  },
  marketer: {
    variant: "marketer",
    title: "Marketer",
    shortTitle: "Marketer",
    dashboardTitle: "Marketer Dashboard",
    subtitle: "Your daily plan, targets, visits, orders, collections, and follow-up workload.",
    workspaceLabel: "Field workspace",
  },
  accounts: {
    variant: "accounts",
    title: "Accounts Officer",
    shortTitle: "Accounts Officer",
    dashboardTitle: "Accounts Dashboard",
    subtitle: "Review orders, verify customer balances, and approve delivery release.",
    workspaceLabel: "Accounts department",
  },
  factory_operator: {
    variant: "delivery",
    title: "Delivery Officer",
    shortTitle: "Delivery Officer",
    dashboardTitle: "Delivery Dashboard",
    subtitle: "Real-time overview of delivery operations and order fulfillment.",
    workspaceLabel: "Delivery department",
  },
};

export const DEFAULT_ROLE_PRESENTATION: RolePresentation = {
  variant: "workspace",
  title: "Team Member",
  shortTitle: "Team Member",
  dashboardTitle: "Sales Master Dashboard",
  subtitle: "Operational overview scoped to your access.",
  workspaceLabel: "Operational workspace",
};

export function getRolePresentation(role: AppRole | null | undefined): RolePresentation {
  if (!role) return DEFAULT_ROLE_PRESENTATION;
  return ROLE_PRESENTATION[role] ?? DEFAULT_ROLE_PRESENTATION;
}
