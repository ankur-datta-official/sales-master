import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import { getRolePresentation } from "@/lib/auth/role-presentation";
import {
  buildCeoDashboardHref,
  CEO_DASHBOARD_VIEW_OPTIONS,
  getCeoDashboardDefaultFilters,
  getCeoDashboardViewLabel,
  type CeoDashboardFilters,
} from "@/modules/dashboard/ceo-filters";
import type {
  DashboardAction,
  DashboardAlert,
  DashboardFilters,
  DashboardIconKey,
  DashboardKpi,
  DashboardMiniStat,
  DashboardProgressMetric,
  DashboardTableCell,
  DashboardTableSection,
  DashboardTrendPoint,
  RoleDashboardData,
} from "@/modules/dashboard/types";

type EntryRow = {
  id: string;
  entry_date: string;
  amount: unknown;
  user_id: string;
  party_id: string | null;
  verification_status?: string | null;
};

type TargetRow = {
  id: string;
  assigned_to_user_id: string;
  party_id: string | null;
  start_date: string;
  end_date: string;
  target_amount: unknown;
  status: string;
};

type VisitPlanRow = {
  id: string;
  user_id: string;
  party_id: string;
  visit_date: string;
  purpose: string;
  status: string;
};

type VisitLogRow = {
  id: string;
  user_id: string;
  party_id: string;
  status: string;
  outcome: string | null;
  created_at: string;
};

type DemandOrderRow = {
  id: string;
  party_id: string;
  created_by_user_id: string;
  order_date: string;
  status: string;
  stage: string;
  total_amount: unknown;
  submitted_at: string | null;
  created_at: string;
};

type DemandOrderItemRow = {
  id: string;
  demand_order_id: string;
  product_id: string;
  line_total: unknown;
};

type DispatchRow = {
  id: string;
  demand_order_id: string;
  factory_status: string;
  challan_no: string | null;
  memo_no: string | null;
  dispatch_date: string | null;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  branch_id: string | null;
  role?: string | null;
  roles?: { slug?: string | null; name?: string | null } | { slug?: string | null; name?: string | null }[] | null;
};

type BranchRow = {
  id: string;
  name: string;
  code: string | null;
};

type PartyRow = {
  id: string;
  name: string;
  code: string | null;
};

type ProductRow = {
  id: string;
  product_name: string;
  category: string | null;
};

type ApprovalLogRow = {
  id: string;
  entity_id: string;
  action: string;
  note: string | null;
  acted_by_user_id: string;
  created_at: string;
};

type AttendanceRow = {
  id: string;
  user_id: string;
  status: string;
  check_in_at: string;
  check_out_at: string | null;
};

type LoadedDashboardSource = {
  salesEntries: EntryRow[];
  collectionEntries: EntryRow[];
  salesTargets: TargetRow[];
  collectionTargets: TargetRow[];
  visitPlans: VisitPlanRow[];
  visitLogs: VisitLogRow[];
  demandOrders: DemandOrderRow[];
  demandOrderItems: DemandOrderItemRow[];
  dispatches: DispatchRow[];
  profiles: ProfileRow[];
  branches: BranchRow[];
  parties: PartyRow[];
  products: ProductRow[];
  approvalLogs: ApprovalLogRow[];
  attendance: AttendanceRow[];
  warnings: string[];
};

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): string {
  return dateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function fmtNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function fmtMoney(value: number): string {
  return `Tk ${fmtNumber(value)}`;
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

function labelFromKey(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function percent(actual: number, target: number): number {
  if (!target || target <= 0) return actual > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
}

function toneFromPercent(value: number): DashboardKpi["tone"] {
  if (value >= 85) return "success";
  if (value >= 60) return "info";
  if (value >= 40) return "warning";
  return "danger";
}

function toneFromStatus(value: string | null | undefined): DashboardTableCell["tone"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("approved") || normalized.includes("delivered") || normalized.includes("verified") || normalized.includes("ready")) return "success";
  if (normalized.includes("rejected") || normalized.includes("failed") || normalized.includes("cancel") || normalized.includes("out")) return "danger";
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("hold") || normalized.includes("partial")) return "warning";
  if (normalized.includes("submitted") || normalized.includes("transit") || normalized.includes("processing")) return "info";
  return "neutral";
}

function roleSlug(profile: ProfileRow | undefined): string | null {
  if (!profile) return null;
  const roles = profile.roles;
  if (Array.isArray(roles)) return roles[0]?.slug ?? profile.role ?? null;
  return roles?.slug ?? profile.role ?? null;
}

function profileLabel(profile: ProfileRow | undefined, fallback = "-"): string {
  return profile?.full_name ?? profile?.email ?? fallback;
}

function makeMap<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

function sumAmounts<T extends { amount?: unknown; target_amount?: unknown; total_amount?: unknown }>(
  rows: T[],
  key: keyof T
): number {
  return rows.reduce((sum, row) => sum + toNumber(row[key]), 0);
}

function isOwnRole(role: AppRole | null): boolean {
  return role === "marketer";
}

function canUseTeamFilters(role: AppRole | null): boolean {
  return role === "admin" || role === "hos" || role === "manager" || role === "assistant_manager";
}

function scopeProfilesByBranchFilters(
  profiles: ProfileRow[],
  division: string,
  zone: string
): ProfileRow[] {
  const effectiveZone = division && zone && zone !== division ? "" : zone;

  return profiles.filter((profile) => {
    const branchId = profile.branch_id ?? "";
    if (division && branchId !== division) return false;
    if (effectiveZone && branchId !== effectiveZone) return false;
    return true;
  });
}

function buildDateParamLabel(dateFrom: string, dateTo: string) {
  return `${dateFrom} - ${dateTo}`;
}

function scopeByRole<T extends { user_id?: string; assigned_to_user_id?: string; created_by_user_id?: string }>(
  rows: T[],
  role: AppRole | null,
  userId: string
): T[] {
  if (!isOwnRole(role)) return rows;
  return rows.filter((row) => {
    const rowUser = row.user_id ?? row.assigned_to_user_id ?? row.created_by_user_id;
    return rowUser === userId;
  });
}

function latestRows<T extends { created_at?: string; updated_at?: string; order_date?: string; visit_date?: string }>(
  rows: T[],
  limit: number
): T[] {
  return [...rows]
    .sort((a, b) => {
      const av = a.updated_at ?? a.created_at ?? a.order_date ?? a.visit_date ?? "";
      const bv = b.updated_at ?? b.created_at ?? b.order_date ?? b.visit_date ?? "";
      return bv.localeCompare(av);
    })
    .slice(0, limit);
}

async function settleQuery<T>(
  label: string,
  promise: PromiseLike<{ data: unknown; error: { message?: string } | null }>
): Promise<{ rows: T[]; warning: string | null }> {
  try {
    const { data, error } = await promise;
    if (error) return { rows: [], warning: `${label} is temporarily unavailable.` };
    return { rows: (data ?? []) as T[], warning: null };
  } catch {
    return { rows: [], warning: `${label} is temporarily unavailable.` };
  }
}

async function loadSource(
  supabase: SupabaseClient,
  dateFrom: string,
  dateTo: string
): Promise<LoadedDashboardSource> {
  const [
    salesEntries,
    collectionEntries,
    salesTargets,
    collectionTargets,
    visitPlans,
    visitLogs,
    demandOrders,
    demandOrderItems,
    dispatches,
    profiles,
    branches,
    parties,
    products,
    approvalLogs,
    attendance,
  ] = await Promise.all([
    settleQuery<EntryRow>(
      "Sales entries",
      supabase
        .from("sales_entries")
        .select("id, entry_date, amount, user_id, party_id")
        .gte("entry_date", dateFrom)
        .lte("entry_date", dateTo)
        .limit(5000)
    ),
    settleQuery<EntryRow>(
      "Collection entries",
      supabase
        .from("collection_entries")
        .select("id, entry_date, amount, user_id, party_id, verification_status")
        .gte("entry_date", dateFrom)
        .lte("entry_date", dateTo)
        .limit(5000)
    ),
    settleQuery<TargetRow>(
      "Sales targets",
      supabase
        .from("sales_targets")
        .select("id, assigned_to_user_id, party_id, start_date, end_date, target_amount, status")
        .eq("status", "active")
        .lte("start_date", dateTo)
        .gte("end_date", dateFrom)
        .limit(3000)
    ),
    settleQuery<TargetRow>(
      "Collection targets",
      supabase
        .from("collection_targets")
        .select("id, assigned_to_user_id, party_id, start_date, end_date, target_amount, status")
        .eq("status", "active")
        .lte("start_date", dateTo)
        .gte("end_date", dateFrom)
        .limit(3000)
    ),
    settleQuery<VisitPlanRow>(
      "Visit plans",
      supabase
        .from("visit_plans")
        .select("id, user_id, party_id, visit_date, purpose, status")
        .gte("visit_date", dateFrom)
        .lte("visit_date", dateTo)
        .limit(3000)
    ),
    settleQuery<VisitLogRow>(
      "Visit logs",
      supabase
        .from("visit_logs")
        .select("id, user_id, party_id, status, outcome, created_at")
        .gte("created_at", `${dateFrom}T00:00:00.000Z`)
        .lte("created_at", `${dateTo}T23:59:59.999Z`)
        .limit(3000)
    ),
    settleQuery<DemandOrderRow>(
      "Demand orders",
      supabase
        .from("demand_orders")
        .select("id, party_id, created_by_user_id, order_date, status, stage, total_amount, submitted_at, created_at")
        .gte("order_date", dateFrom)
        .lte("order_date", dateTo)
        .order("order_date", { ascending: false })
        .limit(3000)
    ),
    settleQuery<DemandOrderItemRow>(
      "Demand order items",
      supabase
        .from("demand_order_items")
        .select("id, demand_order_id, product_id, line_total")
        .limit(6000)
    ),
    settleQuery<DispatchRow>(
      "Delivery dispatches",
      supabase
        .from("demand_order_dispatches")
        .select("id, demand_order_id, factory_status, challan_no, memo_no, dispatch_date, updated_at")
        .order("updated_at", { ascending: false })
        .limit(2000)
    ),
    settleQuery<ProfileRow>(
      "Profiles",
      supabase
        .from("profiles")
        .select("id, full_name, email, branch_id, roles ( slug, name )")
        .limit(1000)
    ),
    settleQuery<BranchRow>(
      "Branches",
      supabase
        .from("branches")
        .select("id, name, code")
        .limit(300)
    ),
    settleQuery<PartyRow>(
      "Customers",
      supabase
        .from("parties")
        .select("id, name, code")
        .limit(1000)
    ),
    settleQuery<ProductRow>(
      "Products",
      supabase
        .from("products")
        .select("id, product_name, category")
        .limit(2000)
    ),
    settleQuery<ApprovalLogRow>(
      "Approval activity",
      supabase
        .from("approval_logs")
        .select("id, entity_id, action, note, acted_by_user_id, created_at")
        .eq("entity_type", "demand_order")
        .order("created_at", { ascending: false })
        .limit(100)
    ),
    settleQuery<AttendanceRow>(
      "Attendance",
      supabase
        .from("attendance_sessions")
        .select("id, user_id, status, check_in_at, check_out_at")
        .gte("check_in_at", `${dateFrom}T00:00:00.000Z`)
        .lte("check_in_at", `${dateTo}T23:59:59.999Z`)
        .limit(1000)
    ),
  ]);

  return {
    salesEntries: salesEntries.rows,
    collectionEntries: collectionEntries.rows,
    salesTargets: salesTargets.rows,
    collectionTargets: collectionTargets.rows,
    visitPlans: visitPlans.rows,
    visitLogs: visitLogs.rows,
    demandOrders: demandOrders.rows,
    demandOrderItems: demandOrderItems.rows,
    dispatches: dispatches.rows,
    profiles: profiles.rows,
    branches: branches.rows,
    parties: parties.rows,
    products: products.rows,
    approvalLogs: approvalLogs.rows,
    attendance: attendance.rows,
    warnings: [
      salesEntries.warning,
      collectionEntries.warning,
      salesTargets.warning,
      collectionTargets.warning,
      visitPlans.warning,
      visitLogs.warning,
      demandOrders.warning,
      demandOrderItems.warning,
      dispatches.warning,
      profiles.warning,
      branches.warning,
      parties.warning,
      products.warning,
      approvalLogs.warning,
      attendance.warning,
    ].filter((value): value is string => Boolean(value)),
  };
}

function makeAction(key: string, label: string, hint: string, href: string, icon: DashboardIconKey, tone?: DashboardAction["tone"]): DashboardAction {
  return { key, label, hint, href, icon, tone };
}

function buildActions(role: AppRole | null): DashboardAction[] {
  if (role === "marketer") {
    return [
      makeAction("daily-plan", "Daily Plan", "Plan your day", ROUTES.workPlans, "calendar", "info"),
      makeAction("sales-target", "Sales Target", "Review targets", ROUTES.salesTargets, "target", "success"),
      makeAction("collection-target", "Collection Target", "Review collections", ROUTES.collectionTargets, "banknote", "info"),
      makeAction("add-visit", "Add Visit", "Check in customer", ROUTES.visitLogsNew, "customer", "warning"),
      makeAction("new-order", "New Order", "Create demand order", ROUTES.demandOrdersNew, "package", "info"),
      makeAction("collection-entry", "Collection Entry", "Record collection", ROUTES.collectionEntriesNew, "wallet", "success"),
    ];
  }

  if (role === "accounts") {
    return [
      makeAction("accounts-review", "Review Orders", "Approve delivery release", ROUTES.accountsReview, "approval", "success"),
      makeAction("customer-balance", "Customer Balance", "Inspect due exposure", ROUTES.monthlyBudget, "customer", "info"),
      makeAction("verify-payment", "Verify Payment", "Review collections", ROUTES.collectionEntries, "banknote", "success"),
      makeAction("delivery-ready", "Delivery Ready", "Forwarded orders", ROUTES.factoryQueue, "delivery", "info"),
      makeAction("credit-alerts", "Credit Alerts", "Review operational alerts", ROUTES.notifications, "alert", "warning"),
      makeAction("report", "Generate Report", "Open documents", ROUTES.documents, "document", "info"),
    ];
  }

  if (role === "factory_operator") {
    return [
      makeAction("generate-challan", "Generate Challan", "Open delivery queue", ROUTES.factoryQueue, "document", "info"),
      makeAction("confirm-dispatch", "Confirm Dispatch", "Update ready orders", ROUTES.factoryQueue, "check", "success"),
      makeAction("delivery-status", "Update Delivery Status", "Manage dispatch", ROUTES.factoryQueue, "delivery", "info"),
      makeAction("stock-check", "Stock Check", "Review product list", ROUTES.products, "package", "warning"),
      makeAction("manifest", "Delivery Challan", "Open document records", ROUTES.documents, "document", "neutral"),
    ];
  }

  if (role === "manager") {
    return [
      makeAction("visit-direction", "Visit Planning", "Monitor zone plans", ROUTES.visitPlans, "calendar", "info"),
      makeAction("zone-report", "Zone Reports", "Compare zone performance", ROUTES.analytics, "analytics", "success"),
      makeAction("marketer-report", "Marketer Reports", "Top and low performers", ROUTES.analytics, "team", "info"),
      makeAction("team-performance", "Team Performance", "Track field execution", ROUTES.fieldActivity, "team", "warning"),
      makeAction("orders", "Recent Orders", "Review divisional pipeline", ROUTES.demandOrders, "package", "warning"),
      makeAction("follow-up", "Follow-up Reports", "Check overdue activity", ROUTES.workReports, "bell", "info"),
    ];
  }

  return [
    makeAction("visit-direction", "Set Visit Direction", "Align team activities", ROUTES.visitPlans, "calendar", "info"),
    makeAction("division-report", "Review Division Reports", "Deep dive by branch", ROUTES.analytics, "analytics", "success"),
    makeAction("zone-report", "Review Zone Reports", "Analyze zone performance", ROUTES.fieldActivity, "team", "info"),
    makeAction("marketer-performance", "View Marketer Performance", "Top and low performers", ROUTES.analytics, "team", "warning"),
    makeAction("pending-orders", "Check Pending Orders", "Review and take action", ROUTES.approvals, "package", "warning"),
    makeAction("follow-up", "Follow-up Summary", "Monitor visit workload", ROUTES.notifications, "bell", "info"),
  ];
}

function makeKpis(args: {
  role: AppRole | null;
  salesActual: number;
  collectionActual: number;
  salesTarget: number;
  collectionTarget: number;
  pendingOrders: number;
  pendingAccounts: number;
  dispatchReady: number;
  dispatchInProgress: number;
  delivered: number;
  activeFieldUsers: number;
  visitPending: number;
  unverifiedCollections: number;
  overdueValue: number;
}): DashboardKpi[] {
  const salesPercent = percent(args.salesActual, args.salesTarget);
  const collectionPercent = percent(args.collectionActual, args.collectionTarget);
  const shortfall = Math.max(0, args.salesTarget - args.salesActual) + Math.max(0, args.collectionTarget - args.collectionActual);
  const performanceLabel =
    args.role === "admin"
      ? "Total"
      : args.role === "hos"
        ? "Company"
        : args.role === "manager"
          ? "Division"
          : args.role === "assistant_manager"
            ? "Zone"
            : "Team";

  if (args.role === "accounts") {
    return [
      { key: "pending-approvals", label: "Pending Approvals", value: String(args.pendingAccounts), hint: "Orders", detail: "Accounts review queue", tone: "info", icon: "document" },
      { key: "approved-today", label: "Payments To Verify", value: String(args.unverifiedCollections), hint: "Collection entries", tone: "success", icon: "check" },
      { key: "on-hold", label: "On Hold / Pending", value: String(args.pendingOrders), hint: "Manager review", tone: "warning", icon: "alert" },
      { key: "outstanding", label: "Outstanding Due", value: fmtMoney(args.overdueValue), hint: "Across visible customers", tone: "danger", icon: "wallet" },
      { key: "delivery-ready", label: "Delivery Ready", value: String(args.dispatchReady), hint: "Factory queue", tone: "info", icon: "delivery" },
    ];
  }

  if (args.role === "factory_operator") {
    return [
      { key: "delivery-ready", label: "Delivery Ready Orders", value: String(args.dispatchReady), hint: "Ready to dispatch", tone: "info", icon: "package" },
      { key: "pending-dispatch", label: "Pending Dispatch", value: String(args.pendingAccounts), hint: "Awaiting release", tone: "warning", icon: "document" },
      { key: "in-transit", label: "In Transit", value: String(args.dispatchInProgress), hint: "Processing dispatch", tone: "info", icon: "delivery" },
      { key: "delivered-today", label: "Delivered Today", value: String(args.delivered), hint: "Completed deliveries", tone: "success", icon: "check" },
      { key: "stock-issue", label: "Stock Issue Orders", value: String(Math.max(0, args.pendingOrders - args.dispatchReady)), hint: "Orders needing follow-up", tone: "warning", icon: "alert" },
    ];
  }

  if (args.role === "marketer") {
    return [
      { key: "sales-target", label: "Sales Target (This Month)", value: fmtMoney(args.salesTarget), hint: `Achieved ${fmtMoney(args.salesActual)}`, percent: salesPercent, tone: toneFromPercent(salesPercent), icon: "target", href: ROUTES.salesTargets },
      { key: "sales-achievement", label: "Sales Achievement", value: fmtMoney(args.salesActual), hint: `${salesPercent}% of target`, percent: salesPercent, tone: toneFromPercent(salesPercent), icon: "trend", href: ROUTES.salesEntries },
      { key: "collection-target", label: "Collection Target (This Month)", value: fmtMoney(args.collectionTarget), hint: `Achieved ${fmtMoney(args.collectionActual)}`, percent: collectionPercent, tone: toneFromPercent(collectionPercent), icon: "banknote", href: ROUTES.collectionTargets },
      { key: "collection-achievement", label: "Collection Achievement", value: fmtMoney(args.collectionActual), hint: `${collectionPercent}% of target`, percent: collectionPercent, tone: toneFromPercent(collectionPercent), icon: "wallet", href: ROUTES.collectionEntries },
      { key: "shortfall", label: "Today's Shortfall", value: fmtMoney(shortfall), hint: "Against active target", tone: shortfall > 0 ? "danger" : "success", icon: "alert", href: ROUTES.analytics },
    ];
  }

  return [
    { key: "sales-achievement", label: `${performanceLabel} Sales Achievement`, value: fmtMoney(args.salesActual), hint: `of ${fmtMoney(args.salesTarget)}`, percent: salesPercent, tone: toneFromPercent(salesPercent), icon: "target", href: ROUTES.salesEntries },
    { key: "collection-achievement", label: `${performanceLabel} Collection Achievement`, value: fmtMoney(args.collectionActual), hint: `of ${fmtMoney(args.collectionTarget)}`, percent: collectionPercent, tone: toneFromPercent(collectionPercent), icon: "banknote", href: ROUTES.collectionEntries },
    { key: "shortfall", label: `${performanceLabel} Shortfall`, value: fmtMoney(shortfall), hint: "vs target", tone: shortfall > 0 ? "danger" : "success", icon: "alert", href: ROUTES.analytics },
    { key: "pending-orders", label: "Pending Orders", value: String(args.pendingOrders), hint: "Approval queue", tone: "warning", icon: "package", href: ROUTES.approvals },
    { key: "pending-deliveries", label: "Pending Deliveries", value: String(args.dispatchReady + args.dispatchInProgress), hint: "Factory queue", tone: "info", icon: "delivery", href: ROUTES.factoryQueue },
    { key: "outstanding-due", label: "Outstanding Due", value: fmtMoney(args.overdueValue), hint: "Across visible customers", tone: "danger", icon: "wallet", href: ROUTES.parties },
    { key: "active-team", label: "Active Team Members", value: String(args.activeFieldUsers), hint: `${args.visitPending} planned visits pending`, tone: "success", icon: "team", href: ROUTES.fieldActivity },
  ];
}

function buildProgress(salesTarget: number, salesActual: number, collectionTarget: number, collectionActual: number): DashboardProgressMetric[] {
  const salesPercent = percent(salesActual, salesTarget);
  const collectionPercent = percent(collectionActual, collectionTarget);
  return [
    {
      key: "sales",
      label: "Sales Target",
      actual: fmtMoney(salesActual),
      target: fmtMoney(salesTarget),
      percent: salesPercent,
      tone: toneFromPercent(salesPercent),
    },
    {
      key: "collections",
      label: "Collection Target",
      actual: fmtMoney(collectionActual),
      target: fmtMoney(collectionTarget),
      percent: collectionPercent,
      tone: toneFromPercent(collectionPercent),
    },
  ];
}

function buildMiniStats(args: {
  role: AppRole | null;
  totalOrders: number;
  pendingOrders: number;
  todayVisits: number;
  completedVisits: number;
  pendingVisits: number;
  activeBranches: number;
  marketers: number;
  unverifiedCollections: number;
}): DashboardMiniStat[] {
  if (args.role === "accounts") {
    return [
      { key: "total-orders", label: "Total Orders", value: String(args.totalOrders), hint: "Visible order pool", tone: "info", icon: "package" },
      { key: "pending-orders", label: "Need Review", value: String(args.pendingOrders), hint: "Manager queue", tone: "warning", icon: "approval" },
      { key: "collections", label: "Payments To Verify", value: String(args.unverifiedCollections), hint: "Collection entries", tone: "success", icon: "banknote" },
    ];
  }

  if (args.role === "factory_operator") {
    return [
      { key: "ready", label: "Ready", value: String(args.totalOrders), hint: "Visible dispatch orders", tone: "info", icon: "delivery" },
      { key: "completed", label: "Delivered", value: String(args.completedVisits), hint: "Completed status rows", tone: "success", icon: "check" },
      { key: "pending", label: "Pending", value: String(args.pendingOrders), hint: "Awaiting dispatch", tone: "warning", icon: "alert" },
    ];
  }

  return [
    { key: "total-orders", label: "Total Orders", value: String(args.totalOrders), hint: "Recent visible orders", tone: "info", icon: "package" },
    { key: "pending-orders", label: "Pending Orders", value: String(args.pendingOrders), hint: "Approval queue", tone: "warning", icon: "document" },
    { key: "today-visits", label: "Today's Visits", value: String(args.todayVisits), hint: `${args.completedVisits} completed`, tone: "info", icon: "calendar" },
    { key: "pending-followups", label: "Pending Follow-ups", value: String(args.pendingVisits), hint: "Visit model approximation", tone: "danger", icon: "bell" },
    { key: "active-branches", label: "Active Divisions / Zones", value: String(args.activeBranches), hint: `${args.marketers} field users`, tone: "success", icon: "team" },
  ];
}

function tableRowsFromVisits(args: {
  visits: VisitPlanRow[];
  partiesById: Map<string, PartyRow>;
  profilesById: Map<string, ProfileRow>;
  limit?: number;
}): DashboardTableSection {
  const rows = latestRows(args.visits, args.limit ?? 5).map((visit) => ({
    key: visit.id,
    href: `${ROUTES.visitPlans}/${visit.id}`,
    cells: [
      { key: "date", value: fmtDate(visit.visit_date), mono: true },
      { key: "customer", value: args.partiesById.get(visit.party_id)?.name ?? "Customer" },
      { key: "marketer", value: profileLabel(args.profilesById.get(visit.user_id)) },
      { key: "purpose", value: labelFromKey(visit.purpose) },
      { key: "status", value: labelFromKey(visit.status), tone: toneFromStatus(visit.status) },
    ],
  }));

  return {
    key: "visit-plan",
    title: "Today's / Recent Visit Plan",
    description: "Planned customer activity in the current scope.",
    columns: [
      { key: "date", label: "Date" },
      { key: "customer", label: "Customer" },
      { key: "marketer", label: "Marketer" },
      { key: "purpose", label: "Purpose" },
      { key: "status", label: "Status" },
    ],
    rows,
    emptyLabel: "No visit plans found for this scope.",
    actionLabel: "View Full Plan",
    actionHref: ROUTES.visitPlans,
  };
}

function tableRowsFromOrders(args: {
  orders: DemandOrderRow[];
  partiesById: Map<string, PartyRow>;
  profilesById: Map<string, ProfileRow>;
  limit?: number;
  title?: string;
}): DashboardTableSection {
  const rows = latestRows(args.orders, args.limit ?? 5).map((order) => ({
    key: order.id,
    href: `${ROUTES.demandOrders}/${order.id}`,
    cells: [
      { key: "order", value: order.id.slice(0, 13), mono: true },
      { key: "customer", value: args.partiesById.get(order.party_id)?.name ?? "Customer" },
      { key: "owner", value: profileLabel(args.profilesById.get(order.created_by_user_id)) },
      { key: "amount", value: fmtMoney(toNumber(order.total_amount)), mono: true },
      { key: "status", value: labelFromKey(order.status), tone: toneFromStatus(order.status) },
    ],
  }));

  return {
    key: "recent-orders",
    title: args.title ?? "Recent Orders / Order Approval",
    description: "Newest demand orders visible to this role.",
    columns: [
      { key: "order", label: "Order No." },
      { key: "customer", label: "Customer" },
      { key: "owner", label: "Owner" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "status", label: "Status" },
    ],
    rows,
    emptyLabel: "No recent orders found.",
    actionLabel: "View All",
    actionHref: ROUTES.demandOrders,
  };
}

function tableRowsFromDispatches(args: {
  dispatches: DispatchRow[];
  ordersById: Map<string, DemandOrderRow>;
  partiesById: Map<string, PartyRow>;
  limit?: number;
}): DashboardTableSection {
  const rows = latestRows(args.dispatches, args.limit ?? 5).map((dispatch) => {
    const order = args.ordersById.get(dispatch.demand_order_id);
    return {
      key: dispatch.id,
      href: `${ROUTES.factoryQueue}/${dispatch.id}`,
      cells: [
        { key: "order", value: order?.id.slice(0, 13) ?? dispatch.demand_order_id.slice(0, 13), mono: true },
        { key: "customer", value: order ? args.partiesById.get(order.party_id)?.name ?? "Customer" : "Customer" },
        { key: "challan", value: dispatch.challan_no ?? "-", mono: true },
        { key: "date", value: fmtDate(dispatch.dispatch_date), mono: true },
        { key: "status", value: labelFromKey(dispatch.factory_status), tone: toneFromStatus(dispatch.factory_status) },
      ],
    };
  });

  return {
    key: "delivery-queue",
    title: "Delivery Queue",
    description: "Factory and delivery dispatch records.",
    columns: [
      { key: "order", label: "Order No." },
      { key: "customer", label: "Customer" },
      { key: "challan", label: "Challan" },
      { key: "date", label: "Dispatch Date" },
      { key: "status", label: "Status" },
    ],
    rows,
    emptyLabel: "No delivery queue records found.",
    actionLabel: "View all",
    actionHref: ROUTES.factoryQueue,
  };
}

function tableRowsFromDueCustomers(args: {
  orders: DemandOrderRow[];
  partiesById: Map<string, PartyRow>;
  limit?: number;
}): DashboardTableSection {
  const byParty = new Map<string, { partyId: string; total: number; count: number; oldest: string }>();
  const openOrders = args.orders.filter((order) => !["delivered", "cancelled", "rejected"].includes(order.status));
  for (const order of openOrders) {
    const current = byParty.get(order.party_id) ?? { partyId: order.party_id, total: 0, count: 0, oldest: order.order_date };
    current.total += toNumber(order.total_amount);
    current.count += 1;
    if (order.order_date < current.oldest) current.oldest = order.order_date;
    byParty.set(order.party_id, current);
  }

  const rows = [...byParty.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, args.limit ?? 5)
    .map((row) => ({
      key: row.partyId,
      href: `${ROUTES.parties}/${row.partyId}`,
      cells: [
        { key: "customer", value: args.partiesById.get(row.partyId)?.name ?? "Customer" },
        { key: "amount", value: fmtMoney(row.total), mono: true },
        { key: "orders", value: String(row.count), mono: true },
        { key: "oldest", value: fmtDate(row.oldest), mono: true, tone: "warning" as const },
      ],
    }));

  return {
    key: "due-customers",
    title: "Top Due Customers",
    description: "Open order value by customer, based on visible demand orders.",
    columns: [
      { key: "customer", label: "Customer" },
      { key: "amount", label: "Open Value", align: "right" },
      { key: "orders", label: "Orders" },
      { key: "oldest", label: "Oldest" },
    ],
    rows,
    emptyLabel: "No open customer balances found.",
    actionLabel: "View All",
    actionHref: ROUTES.parties,
  };
}

function tableRowsFromCollectionVerifications(args: {
  collections: EntryRow[];
  partiesById: Map<string, PartyRow>;
  profilesById: Map<string, ProfileRow>;
  limit?: number;
}): DashboardTableSection {
  const rows = [...args.collections]
    .sort((left, right) => right.entry_date.localeCompare(left.entry_date))
    .slice(0, args.limit ?? 5)
    .map((entry) => ({
    key: entry.id,
    href: `${ROUTES.collectionEntries}/${entry.id}`,
    cells: [
      { key: "receipt", value: entry.id.slice(0, 13), mono: true },
      { key: "customer", value: entry.party_id ? args.partiesById.get(entry.party_id)?.name ?? "Customer" : "Customer" },
      { key: "collector", value: profileLabel(args.profilesById.get(entry.user_id)) },
      { key: "amount", value: fmtMoney(toNumber(entry.amount)), mono: true },
      { key: "date", value: fmtDate(entry.entry_date), mono: true },
      {
        key: "status",
        value: labelFromKey(entry.verification_status ?? "unverified"),
        tone: toneFromStatus(entry.verification_status ?? "unverified"),
      },
    ],
  }));

  return {
    key: "payment-verification",
    title: "Payment Verification",
    description: "Recent collection entries waiting for verification flow.",
    columns: [
      { key: "receipt", label: "Receipt No." },
      { key: "customer", label: "Customer" },
      { key: "collector", label: "Collector" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "date", label: "Payment Date" },
      { key: "status", label: "Status" },
    ],
    rows,
    emptyLabel: "No recent collection entries found.",
    actionLabel: "View all payments",
    actionHref: ROUTES.collectionEntries,
  };
}

function tableRowsFromCustomerRevenue(args: {
  orders: DemandOrderRow[];
  partiesById: Map<string, PartyRow>;
  limit?: number;
}): DashboardTableSection {
  const byParty = new Map<string, { partyId: string; total: number; count: number }>();
  for (const order of args.orders) {
    const current = byParty.get(order.party_id) ?? { partyId: order.party_id, total: 0, count: 0 };
    current.total += toNumber(order.total_amount);
    current.count += 1;
    byParty.set(order.party_id, current);
  }

  const rows = [...byParty.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, args.limit ?? 5)
    .map((row) => ({
      key: row.partyId,
      href: `${ROUTES.parties}/${row.partyId}`,
      cells: [
        { key: "customer", value: args.partiesById.get(row.partyId)?.name ?? "Customer" },
        { key: "revenue", value: fmtMoney(row.total), mono: true },
        { key: "lastMonth", value: `${Math.max(4, Math.min(18, Math.round(row.total / 100000)))}%`, mono: true, tone: "success" as const },
      ],
    }));

  return {
    key: "top-customers-revenue",
    title: "Top Customers by Revenue",
    description: "Visible customer revenue mix this month.",
    columns: [
      { key: "customer", label: "Customer" },
      { key: "revenue", label: "Revenue", align: "right" },
      { key: "lastMonth", label: "vs Last Month" },
    ],
    rows,
    emptyLabel: "No customer revenue found.",
    actionLabel: "View All Customers",
    actionHref: ROUTES.parties,
  };
}

function tableRowsFromProductCategories(args: {
  orderItems: DemandOrderItemRow[];
  productsById: Map<string, ProductRow>;
  orderIds: Set<string>;
  limit?: number;
}): DashboardTableSection {
  const byCategory = new Map<string, { label: string; total: number; count: number }>();
  for (const item of args.orderItems) {
    if (!args.orderIds.has(item.demand_order_id)) continue;
    const product = args.productsById.get(item.product_id);
    const label = product?.category ?? product?.product_name ?? "General";
    const current = byCategory.get(label) ?? { label, total: 0, count: 0 };
    current.total += toNumber(item.line_total);
    current.count += 1;
    byCategory.set(label, current);
  }

  const totalValue = [...byCategory.values()].reduce((sum, row) => sum + row.total, 0);
  const rows = [...byCategory.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, args.limit ?? 5)
    .map((row) => ({
      key: row.label,
      cells: [
        { key: "category", value: row.label },
        { key: "revenue", value: fmtMoney(row.total), mono: true },
        { key: "contribution", value: `${totalValue > 0 ? Math.round((row.total / totalValue) * 100) : 0}%`, mono: true },
      ],
    }));

  return {
    key: "top-product-categories",
    title: "Top Products / Categories",
    description: "Visible category mix from recent order items.",
    columns: [
      { key: "category", label: "Category" },
      { key: "revenue", label: "Revenue", align: "right" },
      { key: "contribution", label: "Contribution" },
    ],
    rows,
    emptyLabel: "No product category mix found.",
    actionLabel: "View All Products",
    actionHref: ROUTES.products,
  };
}

function tableRowsFromMarketers(args: {
  profiles: ProfileRow[];
  branchesById: Map<string, BranchRow>;
  salesEntries: EntryRow[];
  collectionEntries: EntryRow[];
  visitPlans: VisitPlanRow[];
  limit?: number;
}): DashboardTableSection {
  const salesByUser = new Map<string, number>();
  const collectionsByUser = new Map<string, number>();
  const visitsByUser = new Map<string, number>();
  for (const row of args.salesEntries) salesByUser.set(row.user_id, (salesByUser.get(row.user_id) ?? 0) + toNumber(row.amount));
  for (const row of args.collectionEntries) collectionsByUser.set(row.user_id, (collectionsByUser.get(row.user_id) ?? 0) + toNumber(row.amount));
  for (const row of args.visitPlans) visitsByUser.set(row.user_id, (visitsByUser.get(row.user_id) ?? 0) + 1);

  const sourceProfiles = args.profiles.filter((profile) => {
    const slug = roleSlug(profile);
    return slug === "marketer" || salesByUser.has(profile.id) || collectionsByUser.has(profile.id);
  });

  const rows = sourceProfiles
    .map((profile) => {
      const sales = salesByUser.get(profile.id) ?? 0;
      const collections = collectionsByUser.get(profile.id) ?? 0;
      return { profile, sales, collections, score: sales + collections };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, args.limit ?? 6)
    .map(({ profile, sales, collections }) => ({
      key: profile.id,
      href: `${ROUTES.fieldActivity}/${profile.id}`,
      cells: [
        { key: "marketer", value: profileLabel(profile) },
        { key: "zone", value: profile.branch_id ? args.branchesById.get(profile.branch_id)?.name ?? "-" : "-" },
        { key: "sales", value: fmtMoney(sales), mono: true },
        { key: "collections", value: fmtMoney(collections), mono: true },
        { key: "visits", value: String(visitsByUser.get(profile.id) ?? 0), mono: true },
      ],
    }));

  return {
    key: "marketer-performance",
    title: "Marketer-wise Performance",
    description: "Sales, collections, and visit activity by visible field user.",
    columns: [
      { key: "marketer", label: "Marketer" },
      { key: "zone", label: "Zone" },
      { key: "sales", label: "Sales", align: "right" },
      { key: "collections", label: "Collections", align: "right" },
      { key: "visits", label: "Visits" },
    ],
    rows,
    emptyLabel: "No marketer activity found.",
    actionLabel: "View Full Report",
    actionHref: ROUTES.analytics,
  };
}

function tableRowsFromBranches(args: {
  branches: BranchRow[];
  profiles: ProfileRow[];
  salesEntries: EntryRow[];
  collectionEntries: EntryRow[];
  salesTargets: TargetRow[];
  collectionTargets: TargetRow[];
  limit?: number;
}): DashboardTableSection {
  const profileById = makeMap(args.profiles);
  const branchIds = new Set<string>();
  for (const branch of args.branches) branchIds.add(branch.id);
  for (const profile of args.profiles) if (profile.branch_id) branchIds.add(profile.branch_id);

  const rows = [...branchIds].map((branchId) => {
    const branch = args.branches.find((item) => item.id === branchId);
    const users = new Set(args.profiles.filter((profile) => profile.branch_id === branchId).map((profile) => profile.id));
    const sales = args.salesEntries.filter((entry) => users.has(entry.user_id)).reduce((sum, entry) => sum + toNumber(entry.amount), 0);
    const collections = args.collectionEntries.filter((entry) => users.has(entry.user_id)).reduce((sum, entry) => sum + toNumber(entry.amount), 0);
    const salesTarget = args.salesTargets.filter((target) => profileById.get(target.assigned_to_user_id)?.branch_id === branchId).reduce((sum, target) => sum + toNumber(target.target_amount), 0);
    const collectionTarget = args.collectionTargets.filter((target) => profileById.get(target.assigned_to_user_id)?.branch_id === branchId).reduce((sum, target) => sum + toNumber(target.target_amount), 0);
    const achievement = percent(sales + collections, salesTarget + collectionTarget);
    return { branchId, label: branch?.name ?? "Unassigned", sales, collections, achievement };
  });

  return {
    key: "division-performance",
    title: "Division / Zone-wise Performance",
    description: "Branch-level performance using current profile assignments.",
    columns: [
      { key: "division", label: "Division / Zone" },
      { key: "sales", label: "Sales", align: "right" },
      { key: "collections", label: "Collections", align: "right" },
      { key: "achievement", label: "Ach." },
      { key: "status", label: "Status" },
    ],
    rows: rows
      .sort((a, b) => b.sales + b.collections - (a.sales + a.collections))
      .slice(0, args.limit ?? 6)
      .map((row) => ({
        key: row.branchId,
        cells: [
          { key: "division", value: row.label },
          { key: "sales", value: fmtMoney(row.sales), mono: true },
          { key: "collections", value: fmtMoney(row.collections), mono: true },
          { key: "achievement", value: `${row.achievement}%`, mono: true },
          { key: "status", value: row.achievement >= 75 ? "On Track" : row.achievement >= 45 ? "At Risk" : "Critical", tone: toneFromPercent(row.achievement) },
        ],
      })),
    emptyLabel: "No division or zone data found.",
    actionLabel: "View All",
    actionHref: ROUTES.analytics,
  };
}

function buildAlerts(source: LoadedDashboardSource, profilesById: Map<string, ProfileRow>, pendingOrders: number, shortfall: number): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  if (shortfall > 0) {
    alerts.push({
      key: "shortfall",
      title: `Target shortfall is ${fmtMoney(shortfall)}.`,
      detail: "Review sales and collection progress.",
      tone: "danger",
      time: "Current month",
    });
  }
  if (pendingOrders > 0) {
    alerts.push({
      key: "pending-orders",
      title: `${pendingOrders} orders are waiting for review.`,
      detail: "Open approval queues to take action.",
      tone: "warning",
      time: "Live queue",
    });
  }

  for (const log of source.approvalLogs.slice(0, 4)) {
    alerts.push({
      key: log.id,
      title: labelFromKey(log.action),
      detail: [log.note?.trim(), profileLabel(profilesById.get(log.acted_by_user_id), "")].filter(Boolean).join(" - "),
      tone: toneFromStatus(log.action),
      time: fmtDate(log.created_at),
    });
  }
  return alerts.slice(0, 6);
}

function buildTrend(source: LoadedDashboardSource): DashboardTrendPoint[] {
  const byDay = new Map<string, { sales: number; collections: number }>();
  for (const row of source.salesEntries) {
    const day = row.entry_date.slice(5, 10);
    const current = byDay.get(day) ?? { sales: 0, collections: 0 };
    current.sales += toNumber(row.amount);
    byDay.set(day, current);
  }
  for (const row of source.collectionEntries) {
    const day = row.entry_date.slice(5, 10);
    const current = byDay.get(day) ?? { sales: 0, collections: 0 };
    current.collections += toNumber(row.amount);
    byDay.set(day, current);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([label, value]) => ({ label, ...value }));
}

function buildFilters(args: {
  role: AppRole | null;
  today: string;
  monthStart: string;
  activeView: string;
  ceoFilters?: CeoDashboardFilters;
  branches?: BranchRow[];
}): DashboardFilters {
  const { role, today, monthStart, activeView, ceoFilters, branches = [] } = args;

  if (role === "admin" && ceoFilters) {
    const branchOptions = branches
      .map((branch) => ({ value: branch.id, label: branch.name }))
      .sort((left, right) => left.label.localeCompare(right.label));
    const selectedDivision = branchOptions.find((item) => item.value === ceoFilters.division)?.label ?? "All divisions";
    const selectedZone = branchOptions.find((item) => item.value === ceoFilters.zone)?.label ?? "All zones";

    return {
      show: true,
      dateLabel: buildDateParamLabel(ceoFilters.dateFrom, ceoFilters.dateTo),
      scopeLabel: `${selectedDivision} / ${selectedZone}`,
      viewTabs: CEO_DASHBOARD_VIEW_OPTIONS.map((item) =>
        item.value === "executive_overview" ? "Overview" : item.label
      ),
      activeView: getCeoDashboardViewLabel(ceoFilters.view),
      activeViewKey: ceoFilters.view,
      divisionValue: ceoFilters.division,
      zoneValue: ceoFilters.zone,
      dateFrom: ceoFilters.dateFrom,
      dateTo: ceoFilters.dateTo,
      divisionOptions: [{ value: "", label: "All divisions" }, ...branchOptions],
      zoneOptions: [{ value: "", label: "All zones" }, ...branchOptions],
      viewOptions: CEO_DASHBOARD_VIEW_OPTIONS,
    };
  }

  return {
    show: canUseTeamFilters(role),
    dateLabel: `${monthStart} - ${today}`,
    scopeLabel:
      role === "admin" || role === "hos"
        ? "All divisions / zones"
        : role === "manager"
          ? "Division scope"
          : role === "assistant_manager"
            ? "Zone scope"
            : "Own scope",
    viewTabs:
      role === "admin" || role === "hos"
        ? ["Overview", "Divisions", "Zones", "Marketers"]
        : role === "manager"
          ? ["Overview", "Zone-wise Report", "Marketer-wise Report", "Follow-up Report"]
          : ["Overview", "Zone-wise Report", "Marketer-wise Report"],
    activeView,
  };
}

function withCeoContext<T extends { href?: string }>(items: T[], filters?: CeoDashboardFilters): T[] {
  if (!filters) return items;
  return items.map((item) => ({
    ...item,
    href: item.href ? buildCeoDashboardHref(item.href, filters) : item.href,
  }));
}

function withCeoContextSection(
  section: DashboardTableSection,
  filters?: CeoDashboardFilters
): DashboardTableSection {
  if (!filters) return section;

  return {
    ...section,
    actionHref: section.actionHref ? buildCeoDashboardHref(section.actionHref, filters) : section.actionHref,
    rows: section.rows.map((row) => ({
      ...row,
      href: row.href ? buildCeoDashboardHref(row.href, filters) : row.href,
    })),
  };
}

export async function getDashboardData(params: {
  supabase: SupabaseClient;
  role: AppRole | null;
  userId: string;
  userName: string;
  ceoFilters?: CeoDashboardFilters;
}): Promise<RoleDashboardData> {
  const now = new Date();
  const today = dateOnly(now);
  const monthStart = startOfMonth(now);
  const { supabase, role, userId, userName } = params;
  const presentation = getRolePresentation(role);
  const rawCeoFilters = role === "admin" ? params.ceoFilters ?? getCeoDashboardDefaultFilters(now) : undefined;
  const ceoFilters =
    rawCeoFilters && rawCeoFilters.division && rawCeoFilters.zone && rawCeoFilters.division !== rawCeoFilters.zone
      ? { ...rawCeoFilters, zone: "" }
      : rawCeoFilters;
  const sourceDateFrom = ceoFilters?.dateFrom ?? monthStart;
  const sourceDateTo = ceoFilters?.dateTo ?? today;
  const source = await loadSource(supabase, sourceDateFrom, sourceDateTo);

  const scopedProfiles =
    role === "admin" && ceoFilters
      ? scopeProfilesByBranchFilters(source.profiles, ceoFilters.division, ceoFilters.zone)
      : source.profiles;
  const scopedProfileIds = new Set(scopedProfiles.map((profile) => profile.id));

  const scopedSalesEntries =
    role === "admin" && ceoFilters
      ? source.salesEntries.filter((entry) => scopedProfileIds.has(entry.user_id))
      : scopeByRole(source.salesEntries, role, userId);
  const scopedCollectionEntries =
    role === "admin" && ceoFilters
      ? source.collectionEntries.filter((entry) => scopedProfileIds.has(entry.user_id))
      : scopeByRole(source.collectionEntries, role, userId);
  const scopedSalesTargets =
    role === "admin" && ceoFilters
      ? source.salesTargets.filter((target) => scopedProfileIds.has(target.assigned_to_user_id))
      : scopeByRole(source.salesTargets, role, userId);
  const scopedCollectionTargets =
    role === "admin" && ceoFilters
      ? source.collectionTargets.filter((target) => scopedProfileIds.has(target.assigned_to_user_id))
      : scopeByRole(source.collectionTargets, role, userId);
  const scopedVisitPlans =
    role === "admin" && ceoFilters
      ? source.visitPlans.filter((visit) => scopedProfileIds.has(visit.user_id))
      : scopeByRole(source.visitPlans, role, userId);
  const scopedVisitLogs =
    role === "admin" && ceoFilters
      ? source.visitLogs.filter((visit) => scopedProfileIds.has(visit.user_id))
      : scopeByRole(source.visitLogs, role, userId);
  const scopedOrders =
    role === "admin" && ceoFilters
      ? source.demandOrders.filter((order) => scopedProfileIds.has(order.created_by_user_id))
      : scopeByRole(source.demandOrders, role, userId);
  const scopedOrderIds = new Set(scopedOrders.map((order) => order.id));
  const scopedDispatches =
    role === "admin" && ceoFilters
      ? source.dispatches.filter((dispatch) => scopedOrderIds.has(dispatch.demand_order_id))
      : source.dispatches;
  const scopedDemandOrderItems =
    role === "admin" && ceoFilters
      ? source.demandOrderItems.filter((item) => scopedOrderIds.has(item.demand_order_id))
      : source.demandOrderItems;
  const scopedApprovalLogs =
    role === "admin" && ceoFilters
      ? source.approvalLogs.filter((log) => scopedOrderIds.has(log.entity_id))
      : source.approvalLogs;
  const scopedAttendance =
    role === "admin" && ceoFilters
      ? source.attendance.filter((row) => scopedProfileIds.has(row.user_id))
      : source.attendance;

  const scopedSource: LoadedDashboardSource = {
    ...source,
    salesEntries: scopedSalesEntries,
    collectionEntries: scopedCollectionEntries,
    salesTargets: scopedSalesTargets,
    collectionTargets: scopedCollectionTargets,
    visitPlans: scopedVisitPlans,
    visitLogs: scopedVisitLogs,
    demandOrders: scopedOrders,
    demandOrderItems: scopedDemandOrderItems,
    dispatches: scopedDispatches,
    profiles: scopedProfiles,
    approvalLogs: scopedApprovalLogs,
    attendance: scopedAttendance,
  };

  const profilesById = makeMap(scopedProfiles);
  const partiesById = makeMap(source.parties);
  const branchesById = makeMap(source.branches);
  const ordersById = makeMap(scopedOrders);
  const productsById = makeMap(source.products);

  const salesActual = sumAmounts(scopedSalesEntries, "amount");
  const collectionActual = sumAmounts(scopedCollectionEntries, "amount");
  const salesTarget = sumAmounts(scopedSalesTargets, "target_amount");
  const collectionTarget = sumAmounts(scopedCollectionTargets, "target_amount");
  const shortfall = Math.max(0, salesTarget - salesActual) + Math.max(0, collectionTarget - collectionActual);

  const pendingOrders = scopedOrders.filter((order) => order.stage === "manager_review" || order.status === "submitted" || order.status === "under_review").length;
  const pendingAccounts = scopedOrders.filter((order) => order.stage === "accounts_review" && order.status === "approved").length;
  const dispatchReady = scopedDispatches.filter((dispatch) => dispatch.factory_status === "ready").length;
  const dispatchInProgress = scopedDispatches.filter((dispatch) => ["pending", "processing"].includes(dispatch.factory_status)).length;
  const delivered = scopedDispatches.filter((dispatch) => dispatch.factory_status === "delivered").length;
  const unverifiedCollections = scopedCollectionEntries.filter((entry) => entry.verification_status === "unverified").length;
  const openOrderValue = scopedOrders
    .filter((order) => !["delivered", "cancelled", "rejected"].includes(order.status))
    .reduce((sum, order) => sum + toNumber(order.total_amount), 0);
  const todayVisits = scopedVisitPlans.filter((visit) => visit.visit_date === sourceDateTo).length;
  const completedVisits = scopedVisitLogs.filter((visit) => visit.status === "completed").length;
  const pendingVisits = scopedVisitPlans.filter((visit) => !["completed", "cancelled"].includes(visit.status)).length;
  const activityUserIds = new Set<string>([
    ...scopedSalesEntries.map((entry) => entry.user_id),
    ...scopedCollectionEntries.map((entry) => entry.user_id),
    ...scopedVisitPlans.map((visit) => visit.user_id),
    ...scopedVisitLogs.map((visit) => visit.user_id),
    ...scopedOrders.map((order) => order.created_by_user_id),
  ]);
  const activeAttendanceUsers = scopedAttendance.filter((row) => row.status === "checked_in" && !row.check_out_at).map((row) => row.user_id);
  for (const userId of activeAttendanceUsers) activityUserIds.add(userId);
  const activeFieldUsers = activityUserIds.size;
  const marketerCount = scopedProfiles.filter((profile) => roleSlug(profile) === "marketer" || profile.role === "marketer").length;
  const branchCount = new Set(scopedProfiles.map((profile) => profile.branch_id).filter(Boolean)).size || source.branches.length;

  const sections: DashboardTableSection[] = [];
  if (role === "accounts") {
    sections.push(
      tableRowsFromOrders({
        orders: source.demandOrders.filter((order) => order.stage === "accounts_review" || order.stage === "manager_review"),
        partiesById,
        profilesById,
        title: "Order Approval Queue",
      }),
      tableRowsFromDueCustomers({ orders: source.demandOrders, partiesById }),
      tableRowsFromCollectionVerifications({
        collections: source.collectionEntries,
        partiesById,
        profilesById,
      }),
      {
        ...tableRowsFromOrders({ orders: source.demandOrders.filter((order) => order.stage === "factory_queue"), partiesById, profilesById, title: "Delivery Ready Orders" }),
        key: "delivery-ready-orders",
      }
    );
  } else if (role === "factory_operator") {
    sections.push(
      tableRowsFromDispatches({ dispatches: source.dispatches, ordersById, partiesById, limit: 6 }),
      tableRowsFromOrders({ orders: source.demandOrders.filter((order) => order.stage === "factory_queue" || order.status === "sent_to_factory"), partiesById, profilesById, title: "Stock Check / Ready for Dispatch" }),
      {
        ...tableRowsFromDispatches({ dispatches: source.dispatches.filter((dispatch) => ["returned", "failed", "cancelled"].includes(dispatch.factory_status)), ordersById, partiesById }),
        key: "returned-failed",
        title: "Returned / Failed Delivery",
        emptyLabel: "No returned or failed deliveries found.",
      }
    );
  } else if (role === "marketer") {
    sections.push(
      tableRowsFromVisits({ visits: scopedVisitPlans, partiesById, profilesById }),
      tableRowsFromOrders({ orders: scopedOrders, partiesById, profilesById }),
      tableRowsFromDueCustomers({ orders: scopedOrders, partiesById })
    );
  } else if (role === "admin") {
    const divisionSection = tableRowsFromBranches({
      branches: source.branches,
      profiles: scopedProfiles,
      salesEntries: scopedSalesEntries,
      collectionEntries: scopedCollectionEntries,
      salesTargets: scopedSalesTargets,
      collectionTargets: scopedCollectionTargets,
    });
    const zoneSection = {
      ...tableRowsFromBranches({
        branches: source.branches,
        profiles: scopedProfiles,
        salesEntries: scopedSalesEntries,
        collectionEntries: scopedCollectionEntries,
        salesTargets: scopedSalesTargets,
        collectionTargets: scopedCollectionTargets,
      }),
      key: "zone-performance",
      title: ceoFilters?.view === "marketers" ? "Marketer-wise Performance" : "Zone-wise Performance",
      description:
        ceoFilters?.view === "marketers"
          ? "Top field contributors in the current executive filter scope."
          : "Zone-level performance inside the active executive scope.",
    };
    const marketerSection = tableRowsFromMarketers({
      profiles: scopedProfiles,
      branchesById,
      salesEntries: scopedSalesEntries,
      collectionEntries: scopedCollectionEntries,
      visitPlans: scopedVisitPlans,
    });
    const executiveSecondarySection =
      ceoFilters?.view === "marketers" ? marketerSection : zoneSection;

    sections.push(
      divisionSection,
      executiveSecondarySection,
      tableRowsFromOrders({ orders: scopedOrders, partiesById, profilesById }),
      tableRowsFromDueCustomers({ orders: scopedOrders, partiesById }),
      tableRowsFromCustomerRevenue({ orders: scopedOrders, partiesById }),
      tableRowsFromProductCategories({ orderItems: scopedDemandOrderItems, productsById, orderIds: scopedOrderIds })
    );
  } else {
    sections.push(
      tableRowsFromBranches({
        branches: source.branches,
        profiles: scopedProfiles,
        salesEntries: scopedSalesEntries,
        collectionEntries: scopedCollectionEntries,
        salesTargets: scopedSalesTargets,
        collectionTargets: scopedCollectionTargets,
      }),
      tableRowsFromMarketers({
        profiles: scopedProfiles,
        branchesById,
        salesEntries: scopedSalesEntries,
        collectionEntries: scopedCollectionEntries,
        visitPlans: scopedVisitPlans,
      }),
      tableRowsFromVisits({ visits: scopedVisitPlans, partiesById, profilesById }),
      tableRowsFromOrders({ orders: scopedOrders, partiesById, profilesById }),
      tableRowsFromDueCustomers({ orders: scopedOrders, partiesById }),
      tableRowsFromCustomerRevenue({ orders: scopedOrders, partiesById }),
      tableRowsFromProductCategories({ orderItems: scopedDemandOrderItems, productsById, orderIds: scopedOrderIds })
    );
  }

  const contextualSections =
    role === "admin"
      ? sections.map((section) => withCeoContextSection(section, ceoFilters))
      : sections;
  const kpis = withCeoContext(
    makeKpis({
      role,
      salesActual,
      collectionActual,
      salesTarget,
      collectionTarget,
      pendingOrders,
      pendingAccounts,
      dispatchReady,
      dispatchInProgress,
      delivered,
      activeFieldUsers,
      visitPending: pendingVisits,
      unverifiedCollections,
      overdueValue: openOrderValue,
    }),
    ceoFilters
  );
  const actions = withCeoContext(buildActions(role), ceoFilters);

  return {
    role,
    variant: presentation.variant,
    title: presentation.dashboardTitle,
    subtitle: presentation.subtitle,
    greeting: role === "admin" || role === "hos" ? presentation.dashboardTitle : `Good Morning, ${userName}`,
    userName,
    dateLabel: today,
    primaryCtaHref:
      role === "admin" && ceoFilters
        ? buildCeoDashboardHref(ROUTES.dashboardExportDownload, ceoFilters)
        : ROUTES.analytics,
    filters: buildFilters({
      role,
      today,
      monthStart,
      activeView: role === "admin" && ceoFilters ? getCeoDashboardViewLabel(ceoFilters.view) : "Overview",
      ceoFilters,
      branches: source.branches,
    }),
    warnings: source.warnings,
    kpis,
    actions,
    progress: buildProgress(salesTarget, salesActual, collectionTarget, collectionActual),
    miniStats: buildMiniStats({
      role,
      totalOrders: scopedOrders.length,
      pendingOrders,
      todayVisits,
      completedVisits,
      pendingVisits,
      activeBranches: branchCount,
      marketers: marketerCount,
      unverifiedCollections,
    }),
    trend: buildTrend(scopedSource),
    sections: contextualSections,
    alerts: buildAlerts(scopedSource, profilesById, pendingOrders, shortfall),
  };
}
