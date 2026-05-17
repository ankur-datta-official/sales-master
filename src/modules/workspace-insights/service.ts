import type { SupabaseClient } from "@supabase/supabase-js";

import type { StatusTone } from "@/components/ui/status-badge";
import type { AppRole } from "@/constants/roles";

type RelationName = { name?: string | null };
type RelationOwner = { full_name?: string | null; email?: string | null };

type OrderRow = {
  id: string;
  order_date: string;
  status: string;
  stage: string;
  total_amount: unknown;
  created_by_user_id: string;
  party?: RelationName[] | null;
};

type EntryRow = {
  id: string;
  entry_date: string;
  amount: unknown;
  user_id: string;
  verification_status?: string | null;
  party?: RelationName[] | null;
};

type TargetRow = {
  id: string;
  assigned_to_user_id: string;
  target_amount: unknown;
  start_date: string;
  end_date: string;
};

type ApprovalLogRow = {
  id: string;
  action: string;
  note: string | null;
  created_at: string;
};

type WorkPlanRow = {
  id: string;
  plan_date: string;
  title: string;
  status: string;
  owner?: RelationOwner[] | null;
};

type WorkReportRow = {
  id: string;
  report_date: string;
  summary: string;
  status: string;
  owner?: RelationOwner[] | null;
};

type DispatchRow = {
  id: string;
  factory_status: string;
  challan_no: string | null;
  dispatch_date: string | null;
  updated_at: string;
};

type WorkspaceActor = {
  role: AppRole | null;
  userId: string;
};

type ExportLaunchpadCard = {
  key: string;
  title: string;
  description: string;
  href: string;
  statsLabel: string;
};

export type WorkspaceNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: StatusTone;
  href: string;
};

export type WorkspaceDocument = {
  id: string;
  title: string;
  type: string;
  owner: string;
  date: string;
  status: string;
  href: string;
};

export type MonthlyBudgetSnapshot = {
  scopeLabel: string;
  allocated: number;
  utilized: number;
  remaining: number;
  utilizationPercent: number;
  salesTarget: number;
  salesActual: number;
  collectionTarget: number;
  collectionActual: number;
  activeOrders: number;
  pendingOrders: number;
  semanticLabel: string;
};

export type ExportLaunchpadData = {
  summary: {
    title: string;
    description: string;
  };
  cards: ExportLaunchpadCard[];
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
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
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function firstRelation<T>(value: T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : null;
}

function toneFromStatus(status: string | null | undefined): StatusTone {
  const normalized = (status ?? "").toLowerCase();
  if (
    normalized.includes("approved") ||
    normalized.includes("delivered") ||
    normalized.includes("verified") ||
    normalized.includes("ready")
  ) {
    return "success";
  }
  if (
    normalized.includes("reject") ||
    normalized.includes("failed") ||
    normalized.includes("overdue") ||
    normalized.includes("returned")
  ) {
    return "danger";
  }
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("hold")) {
    return "warning";
  }
  return "info";
}

function scopeOwnOnly<T extends { user_id?: string; assigned_to_user_id?: string; created_by_user_id?: string }>(
  rows: T[],
  actor: WorkspaceActor
): T[] {
  if (actor.role !== "marketer") return rows;
  return rows.filter((row) => {
    const owner = row.user_id ?? row.assigned_to_user_id ?? row.created_by_user_id;
    return owner === actor.userId;
  });
}

function isLeadershipRole(role: AppRole | null): boolean {
  return role === "admin" || role === "hos" || role === "manager" || role === "assistant_manager";
}

async function queryRows<T>(
  promise: PromiseLike<{ data: T[] | null; error: { message?: string } | null }>
): Promise<T[]> {
  try {
    const { data, error } = await promise;
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

async function loadOrders(supabase: SupabaseClient, limit: number): Promise<OrderRow[]> {
  return queryRows<OrderRow>(
    supabase
      .from("demand_orders")
      .select("id, order_date, status, stage, total_amount, created_by_user_id, party:parties(name)")
      .order("order_date", { ascending: false })
      .limit(limit)
  );
}

async function loadCollectionEntries(supabase: SupabaseClient, limit: number): Promise<EntryRow[]> {
  return queryRows<EntryRow>(
    supabase
      .from("collection_entries")
      .select("id, entry_date, amount, user_id, verification_status, party:parties(name)")
      .order("entry_date", { ascending: false })
      .limit(limit)
  );
}

async function loadSalesEntries(supabase: SupabaseClient, limit: number): Promise<EntryRow[]> {
  return queryRows<EntryRow>(
    supabase
      .from("sales_entries")
      .select("id, entry_date, amount, user_id, party:parties(name)")
      .order("entry_date", { ascending: false })
      .limit(limit)
  );
}

async function loadSalesTargets(supabase: SupabaseClient, limit: number): Promise<TargetRow[]> {
  return queryRows<TargetRow>(
    supabase
      .from("sales_targets")
      .select("id, assigned_to_user_id, target_amount, start_date, end_date")
      .order("start_date", { ascending: false })
      .limit(limit)
  );
}

async function loadCollectionTargets(supabase: SupabaseClient, limit: number): Promise<TargetRow[]> {
  return queryRows<TargetRow>(
    supabase
      .from("collection_targets")
      .select("id, assigned_to_user_id, target_amount, start_date, end_date")
      .order("start_date", { ascending: false })
      .limit(limit)
  );
}

async function loadApprovalLogs(supabase: SupabaseClient, limit: number): Promise<ApprovalLogRow[]> {
  return queryRows<ApprovalLogRow>(
    supabase
      .from("approval_logs")
      .select("id, action, note, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
  );
}

async function loadWorkPlans(supabase: SupabaseClient, limit: number): Promise<WorkPlanRow[]> {
  return queryRows<WorkPlanRow>(
    supabase
      .from("work_plans")
      .select("id, plan_date, title, status, owner:profiles!work_plans_owner_user_id_fkey(full_name, email)")
      .order("plan_date", { ascending: false })
      .limit(limit)
  );
}

async function loadWorkReports(supabase: SupabaseClient, limit: number): Promise<WorkReportRow[]> {
  return queryRows<WorkReportRow>(
    supabase
      .from("work_reports")
      .select("id, report_date, summary, status, owner:profiles!work_reports_owner_user_id_fkey(full_name, email)")
      .order("report_date", { ascending: false })
      .limit(limit)
  );
}

async function loadDispatches(supabase: SupabaseClient, limit: number): Promise<DispatchRow[]> {
  return queryRows<DispatchRow>(
    supabase
      .from("demand_order_dispatches")
      .select("id, factory_status, challan_no, dispatch_date, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit)
  );
}

export async function getWorkspaceNotifications(args: {
  supabase: SupabaseClient;
  role: AppRole | null;
  userId: string;
  limit?: number;
}): Promise<WorkspaceNotification[]> {
  const actor: WorkspaceActor = { role: args.role, userId: args.userId };
  const [orders, collectionEntries, dispatches, approvalLogs] = await Promise.all([
    loadOrders(args.supabase, 120),
    loadCollectionEntries(args.supabase, 120),
    loadDispatches(args.supabase, 60),
    loadApprovalLogs(args.supabase, 20),
  ]);

  const scopedOrders = scopeOwnOnly(orders, actor);
  const scopedCollections = scopeOwnOnly(collectionEntries, actor);

  const workflowNotifications: WorkspaceNotification[] = [
    ...scopedOrders
      .filter((order) => {
        if (actor.role === "accounts") return order.stage === "accounts_review";
        if (actor.role === "factory_operator") return order.stage === "factory_queue" || order.status === "sent_to_factory";
        if (actor.role === "marketer") return order.status !== "delivered" && order.status !== "cancelled";
        return order.stage === "manager_review" || order.stage === "accounts_review";
      })
      .slice(0, 5)
      .map((order) => ({
        id: `order-${order.id}`,
        title: `${labelFromKey(order.stage)} queue item`,
        detail: `${firstRelation(order.party)?.name ?? "Customer"} order is ${labelFromKey(order.status)}.`,
        time: fmtDate(order.order_date),
        tone: toneFromStatus(order.stage),
        href: `/demand-orders/${order.id}`,
      })),
    ...scopedCollections
      .filter((entry) => actor.role === "accounts" ? entry.verification_status === "unverified" : Boolean(entry.verification_status))
      .slice(0, 3)
      .map((entry) => ({
        id: `collection-${entry.id}`,
        title: actor.role === "accounts" ? "Payment verification needed" : "Collection workflow update",
        detail: `${firstRelation(entry.party)?.name ?? "Customer"} collection entry is ${labelFromKey(entry.verification_status ?? "submitted")}.`,
        time: fmtDate(entry.entry_date),
        tone: toneFromStatus(entry.verification_status),
        href: `/collection-entries/${entry.id}`,
      })),
    ...dispatches
      .filter((dispatch) => {
        if (actor.role === "factory_operator") return true;
        if (actor.role === "accounts") return dispatch.factory_status === "ready" || dispatch.factory_status === "pending";
        return isLeadershipRole(actor.role);
      })
      .filter((dispatch) => ["pending", "processing", "returned", "failed", "ready"].includes(dispatch.factory_status))
      .slice(0, 3)
      .map((dispatch) => ({
        id: `dispatch-${dispatch.id}`,
        title: `${labelFromKey(dispatch.factory_status)} dispatch update`,
        detail: dispatch.challan_no ? `Challan ${dispatch.challan_no} needs attention.` : "Delivery workflow needs attention.",
        time: fmtDate(dispatch.dispatch_date ?? dispatch.updated_at),
        tone: toneFromStatus(dispatch.factory_status),
        href: `/factory-queue/${dispatch.id}`,
      })),
    ...(actor.role === "marketer"
      ? []
      : approvalLogs.slice(0, 4).map((log) => ({
          id: `log-${log.id}`,
          title: labelFromKey(log.action),
          detail: log.note?.trim() || "Operational workflow activity recorded.",
          time: fmtDate(log.created_at),
          tone: toneFromStatus(log.action),
          href: "/approvals",
        }))),
  ];

  return workflowNotifications.slice(0, args.limit ?? 12);
}

export async function getWorkspaceDocuments(args: {
  supabase: SupabaseClient;
  role: AppRole | null;
  userId: string;
}): Promise<WorkspaceDocument[]> {
  const actor: WorkspaceActor = { role: args.role, userId: args.userId };
  const [workPlans, workReports, orders, dispatches] = await Promise.all([
    loadWorkPlans(args.supabase, 50),
    loadWorkReports(args.supabase, 50),
    loadOrders(args.supabase, 80),
    loadDispatches(args.supabase, 50),
  ]);

  const planDocs = workPlans.slice(0, 6).map((plan) => ({
    id: `plan-${plan.id}`,
    title: plan.title,
    type: "Work Plan",
    owner: firstRelation(plan.owner)?.full_name ?? firstRelation(plan.owner)?.email ?? "Team member",
    date: fmtDate(plan.plan_date),
    status: labelFromKey(plan.status),
    href: `/work-plans/${plan.id}`,
  }));

  const reportDocs = workReports.slice(0, 6).map((report) => ({
    id: `report-${report.id}`,
    title: report.summary,
    type: "Work Report",
    owner: firstRelation(report.owner)?.full_name ?? firstRelation(report.owner)?.email ?? "Team member",
    date: fmtDate(report.report_date),
    status: labelFromKey(report.status),
    href: `/work-reports/${report.id}`,
  }));

  const orderDocs = scopeOwnOnly(orders, actor).slice(0, 6).map((order) => ({
    id: `order-${order.id}`,
    title: `${firstRelation(order.party)?.name ?? "Customer"} order`,
    type: actor.role === "accounts" ? "Approval Record" : "Demand Order",
    owner: "Sales operation",
    date: fmtDate(order.order_date),
    status: labelFromKey(order.status),
    href: `/demand-orders/${order.id}`,
  }));

  const dispatchDocs = dispatches
    .filter((dispatch) => dispatch.challan_no)
    .slice(0, actor.role === "factory_operator" ? 8 : 4)
    .map((dispatch) => ({
      id: `dispatch-${dispatch.id}`,
      title: dispatch.challan_no ?? "Delivery challan",
      type: "Delivery Challan",
      owner: "Factory queue",
      date: fmtDate(dispatch.dispatch_date ?? dispatch.updated_at),
      status: labelFromKey(dispatch.factory_status),
      href: `/factory-queue/${dispatch.id}`,
    }));

  const documents =
    actor.role === "factory_operator"
      ? [...dispatchDocs, ...orderDocs]
      : actor.role === "marketer"
        ? [...reportDocs, ...planDocs, ...orderDocs]
        : [...dispatchDocs, ...reportDocs, ...planDocs, ...orderDocs];

  return documents.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 18);
}

export async function getMonthlyBudgetSnapshot(args: {
  supabase: SupabaseClient;
  role: AppRole | null;
  userId: string;
}): Promise<MonthlyBudgetSnapshot> {
  const actor: WorkspaceActor = { role: args.role, userId: args.userId };
  const [salesEntries, collectionEntries, salesTargets, collectionTargets, orders] = await Promise.all([
    loadSalesEntries(args.supabase, 200),
    loadCollectionEntries(args.supabase, 200),
    loadSalesTargets(args.supabase, 200),
    loadCollectionTargets(args.supabase, 200),
    loadOrders(args.supabase, 200),
  ]);

  const scopedSalesEntries = scopeOwnOnly(salesEntries, actor);
  const scopedCollectionEntries = scopeOwnOnly(collectionEntries, actor);
  const scopedSalesTargets = scopeOwnOnly(salesTargets, actor);
  const scopedCollectionTargets = scopeOwnOnly(collectionTargets, actor);
  const scopedOrders = scopeOwnOnly(orders, actor);

  const salesTarget = scopedSalesTargets.reduce((sum, row) => sum + toNumber(row.target_amount), 0);
  const collectionTarget = scopedCollectionTargets.reduce((sum, row) => sum + toNumber(row.target_amount), 0);
  const salesActual = scopedSalesEntries.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const collectionActual = scopedCollectionEntries.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const allocated = salesTarget + collectionTarget;
  const utilized = salesActual + collectionActual;
  const remaining = Math.max(0, allocated - utilized);
  const utilizationPercent = allocated > 0 ? Math.min(100, Math.round((utilized / allocated) * 100)) : 0;

  return {
    scopeLabel:
      args.role === "admin" || args.role === "hos"
        ? "Company scope"
        : args.role === "manager"
          ? "Division scope"
          : args.role === "accounts"
            ? "Accounts-controlled scope"
            : "Own scope",
    allocated,
    utilized,
    remaining,
    utilizationPercent,
    salesTarget,
    salesActual,
    collectionTarget,
    collectionActual,
    activeOrders: scopedOrders.filter((order) => !["rejected", "cancelled", "delivered"].includes(order.status)).length,
    pendingOrders: scopedOrders.filter((order) => order.stage === "manager_review" || order.stage === "accounts_review").length,
    semanticLabel:
      args.role === "accounts"
        ? "Credit exposure and receivable pace"
        : args.role === "marketer"
          ? "Target utilization for own pipeline"
          : "Operational target allocation snapshot",
  };
}

export async function getExportLaunchpadData(args: {
  supabase: SupabaseClient;
  role: AppRole | null;
  userId: string;
}): Promise<ExportLaunchpadData> {
  const actor: WorkspaceActor = { role: args.role, userId: args.userId };
  const [orders, collections, dispatches] = await Promise.all([
    loadOrders(args.supabase, 80),
    loadCollectionEntries(args.supabase, 80),
    loadDispatches(args.supabase, 50),
  ]);

  const scopedOrders = scopeOwnOnly(orders, actor);
  const scopedCollections = scopeOwnOnly(collections, actor);

  return {
    summary: {
      title: "Controlled export launchpad",
      description:
        "Use approved operational modules below to review and export records. This page intentionally links only to governed reporting surfaces.",
    },
    cards: [
      {
        key: "analytics",
        title: "Analytics",
        description: "Trend, target, and operational summary views for the current scope.",
        href: "/analytics",
        statsLabel: `${scopedOrders.length} visible orders`,
      },
      {
        key: "demand-orders",
        title: "Demand Orders",
        description: "Order history, approval states, and fulfillment handoff records.",
        href: "/demand-orders",
        statsLabel: `${scopedOrders.filter((order) => order.stage === "manager_review" || order.stage === "accounts_review").length} pending reviews`,
      },
      {
        key: "collections",
        title: "Collection Entries",
        description: "Collections, verification, and receivable progress records.",
        href: "/collection-entries",
        statsLabel: `${scopedCollections.length} visible collection rows`,
      },
      {
        key: "documents",
        title: "Documents",
        description: "Operational documents, work records, and challan references.",
        href: "/documents",
        statsLabel: `${dispatches.filter((dispatch) => Boolean(dispatch.challan_no)).length} challan records`,
      },
    ],
  };
}
