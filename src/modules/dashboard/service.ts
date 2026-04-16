import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import { getActiveFieldUsersSummary } from "@/modules/field-activity/service";
import type {
  DashboardData,
  DashboardQuickWidget,
  DashboardRecentActivity,
  DashboardRecentOrder,
  DashboardRecentWorkReport,
  DashboardSummaryCard,
} from "@/modules/dashboard/types";

function fmtNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function getTodaySalesAndCollections(
  supabase: SupabaseClient
): Promise<{ todaySales: number; todayCollections: number; pendingCollectionVerification: number }> {
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: salesRows }, { data: collectionRows }, { count: pendingCollectionCount }] =
    await Promise.all([
      supabase.from("sales_entries").select("amount").eq("entry_date", today),
      supabase.from("collection_entries").select("amount").eq("entry_date", today),
      supabase
        .from("collection_entries")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "unverified"),
    ]);

  const todaySales = (salesRows ?? []).reduce((sum, r) => sum + toNumber((r as { amount: unknown }).amount), 0);
  const todayCollections = (collectionRows ?? []).reduce(
    (sum, r) => sum + toNumber((r as { amount: unknown }).amount),
    0
  );

  return {
    todaySales,
    todayCollections,
    pendingCollectionVerification: pendingCollectionCount ?? 0,
  };
}

async function getQueueCounts(supabase: SupabaseClient): Promise<{
  pendingApprovals: number;
  pendingAccountsReview: number;
  factoryQueuePending: number;
}> {
  const [pendingApprovalsRes, pendingAccountsRes, factoryQueueRes] = await Promise.all([
    supabase
      .from("demand_orders")
      .select("id", { count: "exact", head: true })
      .eq("stage", "manager_review")
      .in("status", ["submitted", "under_review"]),
    supabase
      .from("demand_orders")
      .select("id", { count: "exact", head: true })
      .eq("stage", "accounts_review")
      .eq("status", "approved"),
    supabase
      .from("demand_order_dispatches")
      .select("id", { count: "exact", head: true })
      .in("factory_status", ["pending", "processing", "ready"]),
  ]);

  return {
    pendingApprovals: pendingApprovalsRes.count ?? 0,
    pendingAccountsReview: pendingAccountsRes.count ?? 0,
    factoryQueuePending: factoryQueueRes.count ?? 0,
  };
}

async function getTargetSummary(
  supabase: SupabaseClient
): Promise<{ activeSalesTargetAmount: number; activeCollectionTargetAmount: number; activeTargetCount: number }> {
  const [{ data: salesTargets }, { data: collectionTargets }] = await Promise.all([
    supabase.from("sales_targets").select("target_amount").eq("status", "active"),
    supabase.from("collection_targets").select("target_amount").eq("status", "active"),
  ]);

  const activeSalesTargetAmount = (salesTargets ?? []).reduce(
    (sum, r) => sum + toNumber((r as { target_amount: unknown }).target_amount),
    0
  );
  const activeCollectionTargetAmount = (collectionTargets ?? []).reduce(
    (sum, r) => sum + toNumber((r as { target_amount: unknown }).target_amount),
    0
  );
  return {
    activeSalesTargetAmount,
    activeCollectionTargetAmount,
    activeTargetCount: (salesTargets?.length ?? 0) + (collectionTargets?.length ?? 0),
  };
}

async function getAttendanceStatus(supabase: SupabaseClient, userId: string): Promise<{
  isCheckedIn: boolean;
  checkInAt: string | null;
}> {
  const { data } = await supabase
    .from("attendance_sessions")
    .select("id, check_in_at")
    .eq("user_id", userId)
    .eq("status", "checked_in")
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { isCheckedIn: Boolean(data), checkInAt: data?.check_in_at ?? null };
}

async function getRecentWorkReports(supabase: SupabaseClient, limit = 5): Promise<DashboardRecentWorkReport[]> {
  const { data } = await supabase
    .from("work_reports")
    .select(
      "id, report_date, summary, status, owner:profiles!work_reports_owner_user_id_fkey(full_name, email)"
    )
    .order("report_date", { ascending: false })
    .limit(limit);

  type WorkReportRow = {
    id: string;
    report_date: string;
    summary: string;
    status: string;
    owner:
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
  };

  return ((data ?? []) as unknown as WorkReportRow[]).map((row) => {
    const owner = pickFirst(row.owner);
    return {
      id: row.id,
      report_date: row.report_date,
      summary: row.summary,
      status: row.status,
      owner_name: owner?.full_name ?? owner?.email ?? null,
    };
  });
}

async function getRecentOrders(supabase: SupabaseClient, limit = 5): Promise<DashboardRecentOrder[]> {
  const { data } = await supabase
    .from("demand_orders")
    .select(
      "id, order_date, status, stage, total_amount, creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email), party:parties!demand_orders_party_id_fkey(name)"
    )
    .order("order_date", { ascending: false })
    .limit(limit);

  type DemandOrderRow = {
    id: string;
    order_date: string;
    status: string;
    stage: string;
    total_amount: unknown;
    creator:
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
    party: { name: string | null } | { name: string | null }[] | null;
  };

  return ((data ?? []) as unknown as DemandOrderRow[]).map((row) => {
    const creator = pickFirst(row.creator);
    const party = pickFirst(row.party);
    return {
      id: row.id,
      order_date: row.order_date,
      status: row.status,
      stage: row.stage,
      total_amount: toNumber(row.total_amount),
      owner_name: creator?.full_name ?? creator?.email ?? null,
      party_name: party?.name ?? null,
    };
  });
}

async function getRecentActivity(supabase: SupabaseClient, limit = 8): Promise<DashboardRecentActivity[]> {
  const { data } = await supabase
    .from("approval_logs")
    .select(
      "id, created_at, action, note, actor:profiles!approval_logs_acted_by_user_id_fkey(full_name, email)"
    )
    .eq("entity_type", "demand_order")
    .order("created_at", { ascending: false })
    .limit(limit);

  type ActivityRow = {
    id: string;
    created_at: string;
    action: string;
    note: string | null;
    actor:
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
  };

  return ((data ?? []) as unknown as ActivityRow[]).map((row) => {
    const actor = pickFirst(row.actor);
    return {
      id: row.id,
      at: row.created_at,
      action: row.action,
      actor_name: actor?.full_name ?? actor?.email ?? null,
      note: (row.note ?? "").trim(),
    };
  });
}

export async function getDashboardData(params: {
  supabase: SupabaseClient;
  role: AppRole | null;
  userId: string;
}): Promise<DashboardData> {
  const { supabase, role, userId } = params;
  const warnings: string[] = [];

  const settled = await Promise.allSettled([
    getTodaySalesAndCollections(supabase),
    getQueueCounts(supabase),
    getTargetSummary(supabase),
    getAttendanceStatus(supabase, userId),
    getActiveFieldUsersSummary(supabase, { staleMinutes: 10, limit: 500 }),
    getRecentWorkReports(supabase),
    getRecentOrders(supabase),
    getRecentActivity(supabase),
  ]);
  const salesCollections =
    settled[0].status === "fulfilled"
      ? settled[0].value
      : { todaySales: 0, todayCollections: 0, pendingCollectionVerification: 0 };
  if (settled[0].status === "rejected") warnings.push("Sales/collection snapshot is temporarily unavailable.");
  const queueCounts =
    settled[1].status === "fulfilled"
      ? settled[1].value
      : { pendingApprovals: 0, pendingAccountsReview: 0, factoryQueuePending: 0 };
  if (settled[1].status === "rejected") warnings.push("Queue counters are temporarily unavailable.");
  const targetSummary =
    settled[2].status === "fulfilled"
      ? settled[2].value
      : { activeSalesTargetAmount: 0, activeCollectionTargetAmount: 0, activeTargetCount: 0 };
  if (settled[2].status === "rejected") warnings.push("Target summary is temporarily unavailable.");
  const attendance =
    settled[3].status === "fulfilled"
      ? settled[3].value
      : { isCheckedIn: false, checkInAt: null };
  if (settled[3].status === "rejected") warnings.push("Attendance summary is temporarily unavailable.");
  const activeFieldUsersResult =
    settled[4].status === "fulfilled"
      ? settled[4].value
      : { ok: false as const, error: "Field activity unavailable." };
  if (settled[4].status === "rejected") warnings.push("Field activity summary is temporarily unavailable.");
  const recentWorkReports = settled[5].status === "fulfilled" ? settled[5].value : [];
  if (settled[5].status === "rejected") warnings.push("Recent work reports are temporarily unavailable.");
  const recentOrders = settled[6].status === "fulfilled" ? settled[6].value : [];
  if (settled[6].status === "rejected") warnings.push("Recent orders are temporarily unavailable.");
  const recentActivity = settled[7].status === "fulfilled" ? settled[7].value : [];
  if (settled[7].status === "rejected") warnings.push("Recent activity is temporarily unavailable.");

  const activeFieldUsersCount = activeFieldUsersResult.ok ? activeFieldUsersResult.data.length : 0;

  const summaryCards: DashboardSummaryCard[] = [];
  const quickWidgets: DashboardQuickWidget[] = [];

  if (role === "marketer") {
    summaryCards.push(
      { key: "today_sales", label: "Today sales", value: fmtNumber(salesCollections.todaySales) },
      { key: "today_collections", label: "Today collections", value: fmtNumber(salesCollections.todayCollections) },
      {
        key: "attendance",
        label: "Attendance",
        value: attendance.isCheckedIn ? "Checked in" : "Not checked in",
        hint: attendance.checkInAt ? `Since ${new Date(attendance.checkInAt).toLocaleTimeString()}` : undefined,
      },
      {
        key: "active_targets",
        label: "Active targets",
        value: String(targetSummary.activeTargetCount),
        hint: `Sales ${fmtNumber(targetSummary.activeSalesTargetAmount)} · Collections ${fmtNumber(
          targetSummary.activeCollectionTargetAmount
        )}`,
      }
    );

    quickWidgets.push(
      { key: "new_work_report", label: "New work report", href: ROUTES.workReportsNew },
      { key: "new_demand_order", label: "New demand order", href: ROUTES.demandOrdersNew },
      { key: "attendance", label: "Attendance", href: ROUTES.attendance }
    );
  } else if (role === "accounts") {
    summaryCards.push(
      {
        key: "pending_accounts_review",
        label: "Pending accounts review",
        value: String(queueCounts.pendingAccountsReview),
      },
      {
        key: "pending_collection_verification",
        label: "Pending collection verification",
        value: String(salesCollections.pendingCollectionVerification),
      },
      { key: "today_collections", label: "Today collections", value: fmtNumber(salesCollections.todayCollections) },
      { key: "factory_queue", label: "Factory queue pending", value: String(queueCounts.factoryQueuePending) }
    );

    quickWidgets.push(
      { key: "accounts_review", label: "Accounts review queue", href: ROUTES.accountsReview },
      { key: "collection_entries", label: "Collection entries", href: ROUTES.collectionEntries },
      { key: "factory_queue", label: "Factory queue", href: ROUTES.factoryQueue }
    );
  } else if (role === "factory_operator") {
    summaryCards.push(
      { key: "factory_queue", label: "Factory queue pending", value: String(queueCounts.factoryQueuePending) },
      {
        key: "ready_to_dispatch",
        label: "Ready to dispatch",
        value: String(
          (
            await supabase
              .from("demand_order_dispatches")
              .select("id", { count: "exact", head: true })
              .eq("factory_status", "ready")
          ).count ?? 0
        ),
      },
      {
        key: "attendance",
        label: "Attendance",
        value: attendance.isCheckedIn ? "Checked in" : "Not checked in",
      }
    );

    quickWidgets.push(
      { key: "factory_queue", label: "Open factory queue", href: ROUTES.factoryQueue },
      { key: "attendance", label: "Attendance", href: ROUTES.attendance }
    );
  } else {
    // admin / hos / manager / assistant_manager / fallback
    summaryCards.push(
      { key: "today_sales", label: "Today sales", value: fmtNumber(salesCollections.todaySales) },
      { key: "today_collections", label: "Today collections", value: fmtNumber(salesCollections.todayCollections) },
      { key: "active_field_users", label: "Active field users", value: String(activeFieldUsersCount) },
      { key: "pending_approvals", label: "Pending approvals", value: String(queueCounts.pendingApprovals) },
      {
        key: "pending_accounts_review",
        label: "Pending accounts review",
        value: String(queueCounts.pendingAccountsReview),
      },
      { key: "factory_queue", label: "Factory queue pending", value: String(queueCounts.factoryQueuePending) },
      {
        key: "active_targets",
        label: "Own/team active targets",
        value: String(targetSummary.activeTargetCount),
        hint: `Sales ${fmtNumber(targetSummary.activeSalesTargetAmount)} · Collections ${fmtNumber(
          targetSummary.activeCollectionTargetAmount
        )}`,
      },
      {
        key: "attendance",
        label: "Your attendance",
        value: attendance.isCheckedIn ? "Checked in" : "Not checked in",
      }
    );

    quickWidgets.push(
      { key: "field_activity", label: "Field activity", href: ROUTES.fieldActivity, value: `${activeFieldUsersCount}` },
      { key: "approvals", label: "Approvals queue", href: ROUTES.approvals, value: `${queueCounts.pendingApprovals}` },
      {
        key: "accounts_review",
        label: "Accounts review",
        href: ROUTES.accountsReview,
        value: `${queueCounts.pendingAccountsReview}`,
      },
      {
        key: "factory_queue",
        label: "Factory queue",
        href: ROUTES.factoryQueue,
        value: `${queueCounts.factoryQueuePending}`,
      }
    );
  }

  return {
    role,
    warnings,
    summary_cards: summaryCards,
    quick_widgets: quickWidgets,
    recent_work_reports: recentWorkReports,
    recent_orders: recentOrders,
    recent_activity: recentActivity,
  };
}
