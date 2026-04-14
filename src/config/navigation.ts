import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, UserRound } from "lucide-react";

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
