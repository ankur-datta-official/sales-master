import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  Bell,
  BookCopy,
  Building2,
  CalendarCheck2,
  CalendarClock,
  ClipboardCheck,
  FileChartColumn,
  FileStack,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  MapPin,
  MapPinned,
  Package,
  PercentCircle,
  Settings,
  ShoppingCart,
  Target,
  Truck,
  UserRound,
  Users,
  WalletMinimal,
} from "lucide-react";

import type { AppRole } from "@/constants/roles";
import { ROUTES } from "@/config/routes";

export type WorkspaceNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type WorkspaceNavSection = {
  label: string;
  items: readonly WorkspaceNavItem[];
};

export type WorkspaceDefinition = {
  searchPlaceholder: string;
  sections: readonly WorkspaceNavSection[];
};

function item(title: string, href: string, icon: LucideIcon): WorkspaceNavItem {
  return { title, href, icon };
}

const SHARED_SYSTEM_SECTION = {
  label: "System",
  items: [
    item("Notifications", ROUTES.notifications, Bell),
    item("Settings", ROUTES.settings, Settings),
  ],
} as const;

const ROLE_WORKSPACES: Record<AppRole, WorkspaceDefinition> = {
  admin: {
    searchPlaceholder: "Search customers, orders, targets, divisions...",
    sections: [
      {
        label: "Executive",
        items: [
          item("Dashboard", ROUTES.dashboard, LayoutDashboard),
          item("Executive Summary", ROUTES.analytics, FileChartColumn),
          item("Divisions", ROUTES.users, Building2),
          item("Zones", ROUTES.fieldActivity, MapPin),
          item("Marketers", ROUTES.users, Users),
        ],
      },
      {
        label: "Operations",
        items: [
          item("Orders Overview", ROUTES.demandOrders, ShoppingCart),
          item("Collections Overview", ROUTES.collectionEntries, WalletMinimal),
          item("Deliveries Overview", ROUTES.factoryQueue, Truck),
        ],
      },
      {
        label: "Analytics & Reports",
        items: [
          item("Reports", ROUTES.analytics, FileText),
          item("Analytics", ROUTES.analytics, LineChart),
          item("Export Data", ROUTES.exportData, FileStack),
          item("Documents", ROUTES.documents, BookCopy),
        ],
      },
      SHARED_SYSTEM_SECTION,
    ],
  },
  hos: {
    searchPlaceholder: "Search divisions, zones, marketers, orders...",
    sections: [
      {
        label: "Planning & Targets",
        items: [
          item("Dashboard", ROUTES.dashboard, LayoutDashboard),
          item("Daily Plan", ROUTES.workPlans, CalendarCheck2),
          item("Visit Plan", ROUTES.visitPlans, MapPin),
          item("Sales Target", ROUTES.salesTargets, Target),
          item("Collection Target", ROUTES.collectionTargets, PercentCircle),
        ],
      },
      {
        label: "Team Management",
        items: [
          item("Divisions", ROUTES.users, Building2),
          item("Zones", ROUTES.fieldActivity, MapPinned),
          item("Marketers", ROUTES.users, Users),
          item("Team Performance", ROUTES.fieldActivity, Activity),
        ],
      },
      {
        label: "Sales Operations",
        items: [
          item("Orders Overview", ROUTES.demandOrders, ShoppingCart),
          item("Collections Overview", ROUTES.collectionEntries, WalletMinimal),
          item("Deliveries Overview", ROUTES.factoryQueue, Truck),
          item("Reports", ROUTES.analytics, FileText),
        ],
      },
      SHARED_SYSTEM_SECTION,
    ],
  },
  manager: {
    searchPlaceholder: "Search zones, marketers, customers, reports...",
    sections: [
      {
        label: "Planning",
        items: [
          item("Dashboard", ROUTES.dashboard, LayoutDashboard),
          item("Visit Planning", ROUTES.visitPlans, CalendarCheck2),
        ],
      },
      {
        label: "Reports & Analytics",
        items: [
          item("Zone Reports", ROUTES.analytics, MapPinned),
          item("Marketer Reports", ROUTES.analytics, Users),
          item("Team Performance", ROUTES.fieldActivity, Activity),
          item("Follow-up Reports", ROUTES.workReports, ClipboardCheck),
        ],
      },
      {
        label: "Operations",
        items: [
          item("Orders Overview", ROUTES.demandOrders, ShoppingCart),
          item("Collections Overview", ROUTES.collectionEntries, WalletMinimal),
          item("Monthly Budget", ROUTES.monthlyBudget, WalletMinimal),
        ],
      },
      SHARED_SYSTEM_SECTION,
    ],
  },
  assistant_manager: {
    searchPlaceholder: "Search team plans, orders, follow-ups...",
    sections: [
      {
        label: "Planning & Targets",
        items: [
          item("Dashboard", ROUTES.dashboard, LayoutDashboard),
          item("Daily Plan", ROUTES.workPlans, CalendarCheck2),
          item("Visit Plan", ROUTES.visitPlans, MapPin),
          item("Sales Target", ROUTES.salesTargets, Target),
          item("Collection Target", ROUTES.collectionTargets, PercentCircle),
        ],
      },
      {
        label: "Team Management",
        items: [
          item("Team Performance", ROUTES.fieldActivity, Activity),
          item("Marketers", ROUTES.users, Users),
        ],
      },
      {
        label: "Sales Operations",
        items: [
          item("Demand Orders", ROUTES.demandOrders, ShoppingCart),
          item("Collections", ROUTES.collectionEntries, WalletMinimal),
          item("Reports", ROUTES.analytics, FileText),
        ],
      },
      SHARED_SYSTEM_SECTION,
    ],
  },
  marketer: {
    searchPlaceholder: "Search customers, visits, orders, collections...",
    sections: [
      {
        label: "Plan & Target",
        items: [
          item("Dashboard", ROUTES.dashboard, LayoutDashboard),
          item("Daily Plan", ROUTES.workPlans, CalendarCheck2),
          item("Sales Target", ROUTES.salesTargets, Target),
          item("Collection Target", ROUTES.collectionTargets, PercentCircle),
          item("Monthly Budget", ROUTES.monthlyBudget, WalletMinimal),
        ],
      },
      {
        label: "Customer & Activity",
        items: [
          item("My Customers", ROUTES.parties, Building2),
          item("Visit Plan", ROUTES.visitPlans, MapPin),
          item("Visit Activity", ROUTES.visitLogs, MapPinned),
          item("Follow Up", ROUTES.notifications, Bell),
        ],
      },
      {
        label: "Sales & Order",
        items: [
          item("Demand Order", ROUTES.demandOrders, ShoppingCart),
          item("My Orders", ROUTES.demandOrders, FolderKanban),
          item("Order History", ROUTES.demandOrders, FileStack),
          item("Collection Entry", ROUTES.collectionEntries, WalletMinimal),
          item("Collection History", ROUTES.collectionEntries, FileChartColumn),
        ],
      },
      {
        label: "Reports",
        items: [
          item("My Reports", ROUTES.workReports, ClipboardCheck),
          item("Target vs Achievement", ROUTES.analytics, LineChart),
          item("Documents", ROUTES.documents, BookCopy),
        ],
      },
      SHARED_SYSTEM_SECTION,
    ],
  },
  accounts: {
    searchPlaceholder: "Search orders, customers, payments, challans...",
    sections: [
      {
        label: "Accounts",
        items: [
          item("Dashboard", ROUTES.dashboard, LayoutDashboard),
          item("Pending Order Approval", ROUTES.accountsReview, BadgeCheck),
          item("Customer Balance Check", ROUTES.monthlyBudget, WalletMinimal),
          item("Payment Verification", ROUTES.collectionEntries, WalletMinimal),
          item("Approved Orders", ROUTES.demandOrders, ShoppingCart),
          item("On Hold Orders", ROUTES.demandOrders, FileStack),
          item("Credit Limit Alerts", ROUTES.notifications, Bell),
          item("Delivery Ready", ROUTES.factoryQueue, Truck),
        ],
      },
      {
        label: "Reports",
        items: [
          item("Reports", ROUTES.analytics, FileText),
          item("Documents", ROUTES.documents, BookCopy),
        ],
      },
      SHARED_SYSTEM_SECTION,
    ],
  },
  factory_operator: {
    searchPlaceholder: "Search orders, challans, riders, deliveries...",
    sections: [
      {
        label: "Delivery",
        items: [
          item("Dashboard", ROUTES.dashboard, LayoutDashboard),
          item("Delivery Queue", ROUTES.factoryQueue, Truck),
          item("Stock Check", ROUTES.products, Package),
          item("Ready for Dispatch", ROUTES.factoryQueue, BadgeCheck),
          item("In Transit", ROUTES.factoryQueue, Truck),
          item("Partial Deliveries", ROUTES.factoryQueue, FileStack),
          item("Delivery Challan", ROUTES.documents, BookCopy),
          item("Delivery History", ROUTES.factoryQueue, FileChartColumn),
          item("Returned Items", ROUTES.notifications, Bell),
        ],
      },
      {
        label: "Reference",
        items: [
          item("Products", ROUTES.products, Package),
          item("Demand Orders", ROUTES.demandOrders, ShoppingCart),
        ],
      },
      SHARED_SYSTEM_SECTION,
    ],
  },
};

const DEFAULT_WORKSPACE: WorkspaceDefinition = {
  searchPlaceholder: "Search anything...",
  sections: [
    {
      label: "Workspace",
      items: [
        item("Dashboard", ROUTES.dashboard, LayoutDashboard),
        item("Profile", ROUTES.profile, UserRound),
        item("Attendance", ROUTES.attendance, CalendarClock),
      ],
    },
    SHARED_SYSTEM_SECTION,
  ],
};

export function getWorkspaceDefinition(role: AppRole | null | undefined): WorkspaceDefinition {
  if (!role) return DEFAULT_WORKSPACE;
  return ROLE_WORKSPACES[role] ?? DEFAULT_WORKSPACE;
}

export function flattenWorkspaceItems(
  sections: readonly WorkspaceNavSection[]
): WorkspaceNavItem[] {
  return sections.flatMap((section) => section.items);
}
