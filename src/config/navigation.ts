import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  BadgeCheck,
  MapPin,
  MapPinned,
  Package,
  PercentCircle,
  Banknote,
  ShoppingCart,
  Target,
  Users,
  UserRound,
  WalletMinimal,
  Factory,
  CalendarClock,
  Activity,
  LineChart,
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
    title: "Attendance",
    href: ROUTES.attendance,
    icon: CalendarClock,
  },
  {
    title: "Field activity",
    href: ROUTES.fieldActivity,
    icon: Activity,
    roles: ["assistant_manager", "manager", "hos", "admin"],
  },
  {
    title: "Analytics",
    href: ROUTES.analytics,
    icon: LineChart,
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
  {
    title: "Visit Plans",
    href: ROUTES.visitPlans,
    icon: MapPin,
  },
  {
    title: "Visit Logs",
    href: ROUTES.visitLogs,
    icon: MapPinned,
  },
  {
    title: "Sales Targets",
    href: ROUTES.salesTargets,
    icon: Target,
  },
  {
    title: "Collection Targets",
    href: ROUTES.collectionTargets,
    icon: PercentCircle,
  },
  {
    title: "Sales Entries",
    href: ROUTES.salesEntries,
    icon: WalletMinimal,
  },
  {
    title: "Collection Entries",
    href: ROUTES.collectionEntries,
    icon: Banknote,
  },
  {
    title: "Demand Orders",
    href: ROUTES.demandOrders,
    icon: ShoppingCart,
  },
  {
    title: "Approvals",
    href: ROUTES.approvals,
    icon: ListChecks,
  },
  {
    title: "Accounts review",
    href: ROUTES.accountsReview,
    icon: BadgeCheck,
    roles: ["accounts", "admin"],
  },
  {
    title: "Factory queue",
    href: ROUTES.factoryQueue,
    icon: Factory,
    roles: ["factory_operator", "accounts", "hos", "manager", "assistant_manager", "admin"],
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
