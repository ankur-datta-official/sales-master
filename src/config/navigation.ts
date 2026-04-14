import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  Users,
  UserRound,
} from "lucide-react";

import type { AppRole } from "@/constants/roles";
import { ROUTES } from "@/config/routes";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** If set, only these roles see the item. Omit for all authenticated users */
  roles?: readonly AppRole[];
};

/**
 * Main sidebar navigation — filter with `filterNavByRoles` using the signed-in role.
 */
export const mainNavigation: readonly NavItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    href: ROUTES.profile,
    icon: UserRound,
  },
  {
    title: "Users",
    href: ROUTES.users,
    icon: Users,
  },
  {
    title: "Parties",
    href: ROUTES.parties,
    icon: Building2,
  },
  {
    title: "Products",
    href: ROUTES.products,
    icon: Package,
  },
  {
    title: "Work Plans",
    href: ROUTES.workPlans,
    icon: CalendarCheck2,
  },
  {
    title: "Work Reports",
    href: ROUTES.workReports,
    icon: ClipboardCheck,
  },
] as const;

export function filterNavByRoles(
  items: readonly NavItem[],
  userRole: AppRole | null | undefined
): NavItem[] {
  return items.filter((item) => {
    if (!item.roles?.length) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });
}
