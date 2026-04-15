import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import type { AnalyticsFilters } from "@/modules/analytics/schemas";
import type {
  AnalyticsData,
  AnalyticsPoint,
  AnalyticsScope,
  AnalyticsSummaryCard,
  AnalyticsWidget,
  AttendanceSummarySection,
  CollectionTrendSection,
  OrderPipelineSummarySection,
  SalesTrendSection,
  TargetVsActualSection,
} from "@/modules/analytics/types";

type EntryRow = {
  entry_date: string;
  amount: number | string;
  user_id: string;
  party_id: string;
};

type TargetRow = {
  assigned_to_user_id: string;
  party_id: string | null;
  start_date: string;
  end_date: string;
  target_amount: number | string;
  status: string;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatNum(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function dateInRange(date: string, from: string, to: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function applyScopeFilters<T extends { user_id?: string; assigned_to_user_id?: string; party_id?: string | null }>(
  rows: T[],
  opts: {
    role: AppRole | null;
    currentUserId: string;
    scope: AnalyticsScope;
    userFilter: string;
    partyFilter: string;
  }
): T[] {
  const { role, currentUserId, scope, userFilter, partyFilter } = opts;
  const forceOwn = role === "marketer";
  const canUseUserFilter =
    role === "admin" || role === "hos" || role === "manager" || role === "assistant_manager";

  return rows.filter((row) => {
    const rowUser = row.user_id ?? row.assigned_to_user_id ?? "";
    if ((forceOwn || scope === "own") && rowUser !== currentUserId) return false;
    if (userFilter && canUseUserFilter && rowUser !== userFilter) return false;
    if (partyFilter && row.party_id != null && row.party_id !== partyFilter) return false;
    return true;
  });
}

function aggregateTrend(rows: EntryRow[], from: string, to: string): AnalyticsPoint[] {
  const byDate = new Map<string, number>();
  for (const row of rows) {
    if (!dateInRange(row.entry_date, from, to)) continue;
    byDate.set(row.entry_date, (byDate.get(row.entry_date) ?? 0) + toNumber(row.amount));
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

async function loadSalesTrend(
  supabase: SupabaseClient,
  filters: AnalyticsFilters,
  role: AppRole | null,
  currentUserId: string
): Promise<SalesTrendSection> {
  const { data } = await supabase
    .from("sales_entries")
    .select("entry_date, amount, user_id, party_id")
    .order("entry_date", { ascending: true })
    .limit(5000);

  const scoped = applyScopeFilters((data ?? []) as EntryRow[], {
    role,
    currentUserId,
    scope: filters.scope,
    userFilter: filters.user,
    partyFilter: filters.party,
  });
  const points = aggregateTrend(scoped, filters.dateFrom, filters.dateTo);
  return { total_amount: points.reduce((sum, p) => sum + p.value, 0), points };
}

async function loadCollectionTrend(
  supabase: SupabaseClient,
  filters: AnalyticsFilters,
  role: AppRole | null,
  currentUserId: string
): Promise<CollectionTrendSection> {
  const { data } = await supabase
    .from("collection_entries")
    .select("entry_date, amount, user_id, party_id")
    .order("entry_date", { ascending: true })
    .limit(5000);

  const scoped = applyScopeFilters((data ?? []) as EntryRow[], {
    role,
    currentUserId,
    scope: filters.scope,
    userFilter: filters.user,
    partyFilter: filters.party,
  });
  const points = aggregateTrend(scoped, filters.dateFrom, filters.dateTo);
  return { total_amount: points.reduce((sum, p) => sum + p.value, 0), points };
}

async function loadTargetVsActual(
  supabase: SupabaseClient,
  filters: AnalyticsFilters,
  role: AppRole | null,
  currentUserId: string,
  salesTrend: SalesTrendSection,
  collectionTrend: CollectionTrendSection
): Promise<TargetVsActualSection> {
  const [salesTargetsRes, collectionTargetsRes] = await Promise.all([
    supabase
      .from("sales_targets")
      .select("assigned_to_user_id, party_id, start_date, end_date, target_amount, status")
      .eq("status", "active")
      .limit(2000),
    supabase
      .from("collection_targets")
      .select("assigned_to_user_id, party_id, start_date, end_date, target_amount, status")
      .eq("status", "active")
      .limit(2000),
  ]);

  const scopedSalesTargets = applyScopeFilters((salesTargetsRes.data ?? []) as TargetRow[], {
    role,
    currentUserId,
    scope: filters.scope,
    userFilter: filters.user,
    partyFilter: filters.party,
  }).filter((t) => !(filters.dateTo && t.start_date > filters.dateTo) && !(filters.dateFrom && t.end_date < filters.dateFrom));

  const scopedCollectionTargets = applyScopeFilters((collectionTargetsRes.data ?? []) as TargetRow[], {
    role,
    currentUserId,
    scope: filters.scope,
    userFilter: filters.user,
    partyFilter: filters.party,
  }).filter((t) => !(filters.dateTo && t.start_date > filters.dateTo) && !(filters.dateFrom && t.end_date < filters.dateFrom));

  return {
    sales_target: scopedSalesTargets.reduce((sum, t) => sum + toNumber(t.target_amount), 0),
    sales_actual: salesTrend.total_amount,
    collection_target: scopedCollectionTargets.reduce((sum, t) => sum + toNumber(t.target_amount), 0),
    collection_actual: collectionTrend.total_amount,
  };
}

async function loadAttendanceSummary(
  supabase: SupabaseClient
): Promise<AttendanceSummarySection> {
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: activeNow }, { data: sessionsToday }] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "checked_in")
      .is("check_out_at", null),
    supabase
      .from("attendance_sessions")
      .select("status, check_in_at")
      .gte("check_in_at", `${today}T00:00:00.000Z`)
      .lte("check_in_at", `${today}T23:59:59.999Z`)
      .limit(5000),
  ]);

  const checkedInToday = (sessionsToday ?? []).length;
  const checkedOutToday = (sessionsToday ?? []).filter((s) => (s as { status: string }).status === "checked_out").length;
  const missedCheckout = (sessionsToday ?? []).filter(
    (s) => (s as { status: string }).status === "missed_checkout"
  ).length;

  return {
    active_now: activeNow ?? 0,
    checked_in_today: checkedInToday,
    checked_out_today: checkedOutToday,
    missed_checkout: missedCheckout,
  };
}

async function loadOrderPipelineSummary(supabase: SupabaseClient): Promise<OrderPipelineSummarySection> {
  const { data } = await supabase
    .from("demand_orders")
    .select("status, stage")
    .limit(5000);

  let draft = 0;
  let managerReview = 0;
  let accountsReview = 0;
  let factoryQueue = 0;
  let rejected = 0;
  let sentToFactory = 0;

  for (const row of data ?? []) {
    const status = (row as { status: string }).status;
    const stage = (row as { stage: string | null }).stage ?? "";
    if (status === "draft") draft += 1;
    if (stage === "manager_review") managerReview += 1;
    if (stage === "accounts_review") accountsReview += 1;
    if (stage === "factory_queue") factoryQueue += 1;
    if (status === "rejected") rejected += 1;
    if (status === "sent_to_factory") sentToFactory += 1;
  }

  return {
    draft,
    manager_review: managerReview,
    accounts_review: accountsReview,
    factory_queue: factoryQueue,
    rejected,
    sent_to_factory: sentToFactory,
  };
}

function isTeamViewer(role: AppRole | null): boolean {
  return role === "admin" || role === "hos" || role === "manager" || role === "assistant_manager";
}

function buildCardsAndWidgets(args: {
  role: AppRole | null;
  salesTrend: SalesTrendSection;
  collectionTrend: CollectionTrendSection;
  targetVsActual: TargetVsActualSection;
  attendanceSummary: AttendanceSummarySection;
  orderPipeline: OrderPipelineSummarySection;
  filters: AnalyticsFilters;
}): { cards: AnalyticsSummaryCard[]; widgets: AnalyticsWidget[] } {
  const { role, salesTrend, collectionTrend, targetVsActual, attendanceSummary, orderPipeline, filters } = args;

  const cards: AnalyticsSummaryCard[] = [];
  const widgets: AnalyticsWidget[] = [];

  if (role === "factory_operator") {
    cards.push(
      { key: "factory_queue", label: "Factory queue", value: String(orderPipeline.factory_queue) },
      { key: "sent_to_factory", label: "Sent to factory", value: String(orderPipeline.sent_to_factory) },
      { key: "active_now", label: "Active attendance", value: String(attendanceSummary.active_now) }
    );
    widgets.push(
      { key: "pipeline_factory", label: "Pipeline (factory queue)", value: String(orderPipeline.factory_queue) },
      { key: "pipeline_rejected", label: "Rejected orders", value: String(orderPipeline.rejected) }
    );
    return { cards, widgets };
  }

  if (role === "accounts") {
    cards.push(
      { key: "collections", label: "Collection trend total", value: formatNum(collectionTrend.total_amount) },
      { key: "accounts_review", label: "Accounts review queue", value: String(orderPipeline.accounts_review) },
      { key: "factory_queue", label: "Factory queue", value: String(orderPipeline.factory_queue) }
    );
    widgets.push(
      { key: "collection_actual", label: "Collection actual", value: formatNum(targetVsActual.collection_actual) },
      { key: "collection_target", label: "Collection target", value: formatNum(targetVsActual.collection_target) }
    );
    return { cards, widgets };
  }

  if (role === "marketer") {
    cards.push(
      { key: "sales", label: "My sales trend total", value: formatNum(salesTrend.total_amount) },
      { key: "collections", label: "My collection trend total", value: formatNum(collectionTrend.total_amount) },
      {
        key: "target",
        label: "My target vs actual",
        value: `${formatNum(targetVsActual.sales_actual)} / ${formatNum(targetVsActual.sales_target)}`,
      },
      { key: "attendance", label: "Active attendance now", value: String(attendanceSummary.active_now) }
    );
    widgets.push(
      { key: "scope", label: "Scope", value: "own" },
      { key: "date", label: "Date range", value: filters.dateFrom || filters.dateTo ? "filtered" : "all time" }
    );
    return { cards, widgets };
  }

  // admin / hos / manager / assistant_manager
  cards.push(
    { key: "sales", label: "Sales trend total", value: formatNum(salesTrend.total_amount) },
    { key: "collections", label: "Collection trend total", value: formatNum(collectionTrend.total_amount) },
    { key: "active_attendance", label: "Active attendance", value: String(attendanceSummary.active_now) },
    { key: "pipeline_manager_review", label: "Pending approvals", value: String(orderPipeline.manager_review) },
    { key: "pipeline_accounts_review", label: "Pending accounts review", value: String(orderPipeline.accounts_review) }
  );
  widgets.push(
    {
      key: "sales_tv_actual",
      label: "Sales target vs actual",
      value: `${formatNum(targetVsActual.sales_actual)} / ${formatNum(targetVsActual.sales_target)}`,
    },
    {
      key: "collection_tv_actual",
      label: "Collection target vs actual",
      value: `${formatNum(targetVsActual.collection_actual)} / ${formatNum(targetVsActual.collection_target)}`,
    },
    {
      key: "scope",
      label: "Scope",
      value: isTeamViewer(role) ? filters.scope : "own",
    }
  );
  return { cards, widgets };
}

export async function getAnalyticsBasicsData(args: {
  supabase: SupabaseClient;
  role: AppRole | null;
  userId: string;
  filters: AnalyticsFilters;
}): Promise<AnalyticsData> {
  const { supabase, role, userId, filters } = args;

  const effectiveFilters: AnalyticsFilters = {
    ...filters,
    scope: role === "marketer" ? "own" : filters.scope,
    user:
      role === "admin" || role === "hos" || role === "manager" || role === "assistant_manager"
        ? filters.user
        : "",
  };

  const [salesTrend, collectionTrend, attendanceSummary, orderPipelineSummary] = await Promise.all([
    loadSalesTrend(supabase, effectiveFilters, role, userId),
    loadCollectionTrend(supabase, effectiveFilters, role, userId),
    loadAttendanceSummary(supabase),
    loadOrderPipelineSummary(supabase),
  ]);

  const targetVsActual = await loadTargetVsActual(
    supabase,
    effectiveFilters,
    role,
    userId,
    salesTrend,
    collectionTrend
  );

  const { cards, widgets } = buildCardsAndWidgets({
    role,
    salesTrend,
    collectionTrend,
    targetVsActual,
    attendanceSummary,
    orderPipeline: orderPipelineSummary,
    filters: effectiveFilters,
  });

  const isFactoryOnly = role === "factory_operator";
  const isAccounts = role === "accounts";

  return {
    role,
    summary_cards: cards,
    quick_widgets: widgets,
    sales_trend: isFactoryOnly || isAccounts ? null : salesTrend,
    collection_trend: isFactoryOnly ? null : collectionTrend,
    target_vs_actual: isFactoryOnly ? null : targetVsActual,
    attendance_summary: isAccounts || isFactoryOnly ? null : attendanceSummary,
    order_pipeline_summary: orderPipelineSummary,
  };
}
