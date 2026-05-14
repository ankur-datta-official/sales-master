import type { SupabaseClient } from "@supabase/supabase-js";

import {
  APPROVAL_LOG_ACTIONS,
  DEMAND_ORDER_STATUSES,
  type ApprovalLogAction,
  type DemandOrderStatus,
} from "@/constants/statuses";
import type { AppRole } from "@/constants/roles";
import { APPROVAL_LOG_ROW_SELECT } from "@/modules/approval-logs/select-fields";
import { mapApprovalLogRow } from "@/modules/approval-logs/normalize";
import type { ApprovalLogWithActors } from "@/modules/approval-logs/types";
import { loadDemandOrderForwardTargets } from "@/modules/demand-orders/load-forward-targets";
import { mapDemandOrderItemRow, mapDemandOrderRow } from "@/modules/demand-orders/normalize";
import { canActorReviewDemandOrder } from "@/modules/demand-orders/review-access";
import { canPerformAccountsDemandOrderReview } from "@/lib/users/actor-permissions";
import type {
  ApprovalInboxItem,
  ApprovalWorkspaceData,
  ApprovalWorkspaceDetail,
  ApprovalWorkspaceFilters,
  ApprovalWorkspaceQueue,
} from "@/modules/approvals/types";

const QUEUE_LABELS: Record<ApprovalWorkspaceQueue, string> = {
  manager_review: "Manager Review",
  accounts_review: "Accounts Review",
};

const QUEUE_DESCRIPTIONS: Record<ApprovalWorkspaceQueue, string> = {
  manager_review: "Submitted and forwarded orders waiting for hierarchy approval.",
  accounts_review: "Manager-approved orders waiting for accounts release.",
};

type DemandOrderRow = Parameters<typeof mapDemandOrderRow>[0];
type DemandOrderItemRow = Parameters<typeof mapDemandOrderItemRow>[0];
type ApprovalLogRow = Parameters<typeof mapApprovalLogRow>[0];

function toSingle(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isQueue(value: string): value is ApprovalWorkspaceQueue {
  return value === "manager_review" || value === "accounts_review";
}

function isDemandOrderStatus(value: string): value is DemandOrderStatus {
  return (DEMAND_ORDER_STATUSES as readonly string[]).includes(value);
}

function isApprovalLogAction(value: string): value is ApprovalLogAction {
  return (APPROVAL_LOG_ACTIONS as readonly string[]).includes(value);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatActorLabel(log: ApprovalLogWithActors | undefined): string | null {
  if (!log) return null;
  return log.actor_name ?? log.actor_email ?? log.acted_by_user_id;
}

function mapQueueItem(args: {
  queue: ApprovalWorkspaceQueue;
  row: ReturnType<typeof mapDemandOrderRow>;
  latestLog?: ApprovalLogWithActors;
  isActionable: boolean;
}): ApprovalInboxItem {
  const { queue, row, latestLog, isActionable } = args;
  return {
    entityType: "demand_order",
    id: row.id,
    queue,
    title: row.party_name?.trim() || "Demand order",
    partyName: row.party_name,
    partyCode: row.party_code,
    ownerName: row.creator_name,
    ownerEmail: row.creator_email,
    ownerLabel: row.creator_name ?? row.creator_email ?? row.created_by_user_id,
    amount: row.total_amount,
    stage: row.stage,
    status: row.status,
    remarks: row.remarks ?? "",
    submittedAt: row.submitted_at,
    orderDate: row.order_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestAction: latestLog?.action ?? null,
    latestActionAt: latestLog?.created_at ?? null,
    latestActionNote: latestLog?.note?.trim() ?? "",
    latestActorLabel: formatActorLabel(latestLog),
    isActionable,
  };
}

function matchesFilters(item: ApprovalInboxItem, filters: ApprovalWorkspaceFilters) {
  if (item.queue !== filters.queue) return false;
  if (filters.status && item.status !== filters.status) return false;
  if (filters.action && item.latestAction !== filters.action) return false;
  if (!filters.search) return true;

  const haystack = normalizeText(
    [
      item.id,
      item.title,
      item.partyCode ?? "",
      item.ownerLabel,
      item.remarks,
      item.latestActionNote,
      item.latestActorLabel ?? "",
    ].join(" ")
  );

  return haystack.includes(normalizeText(filters.search));
}

function getDefaultQueue(role: AppRole | null): ApprovalWorkspaceQueue {
  return role === "accounts" ? "accounts_review" : "manager_review";
}

async function loadQueueRows(
  supabase: SupabaseClient,
  queue: ApprovalWorkspaceQueue
) {
  const query = supabase
    .from("demand_orders")
    .select(
      "id, organization_id, party_id, created_by_user_id, order_date, status, stage, total_amount, remarks, submitted_at, created_at, updated_at, party:parties!demand_orders_party_id_fkey(name, code), creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email)"
    )
    .eq("stage", queue)
    .order("submitted_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (queue === "manager_review") {
    return query.in("status", ["submitted", "under_review"]);
  }

  return query.eq("status", "approved");
}

async function computeManagerActionableMap(args: {
  supabase: SupabaseClient;
  role: AppRole | null;
  actorProfileId: string | null;
  rows: ReturnType<typeof mapDemandOrderRow>[];
}) {
  const { supabase, role, actorProfileId, rows } = args;
  const cache = new Map<string, Promise<boolean>>();

  return Promise.all(
    rows.map(async (row) => {
      if (!actorProfileId) return [row.id, false] as const;
      if (!cache.has(row.created_by_user_id)) {
        cache.set(
          row.created_by_user_id,
          canActorReviewDemandOrder(
            supabase,
            actorProfileId,
            row.created_by_user_id,
            role
          )
        );
      }

      return [row.id, await cache.get(row.created_by_user_id)!] as const;
    })
  ).then((entries) => new Map(entries));
}

export async function getApprovalWorkspaceData(args: {
  supabase: SupabaseClient;
  role: AppRole | null;
  actorProfileId: string | null;
  actorOrganizationId: string | null;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<ApprovalWorkspaceData> {
  const {
    supabase,
    role,
    actorProfileId,
    actorOrganizationId,
    searchParams,
  } = args;

  const raw = await searchParams;
  const defaultQueue = getDefaultQueue(role);
  const rawQueue = toSingle(raw.queue);
  const rawStatus = toSingle(raw.status);
  const rawAction = toSingle(raw.action);

  const filters: ApprovalWorkspaceFilters = {
    queue: isQueue(rawQueue) ? rawQueue : defaultQueue,
    status: isDemandOrderStatus(rawStatus) ? rawStatus : "",
    action: isApprovalLogAction(rawAction) ? rawAction : "",
    search: toSingle(raw.search).trim(),
    selected: toSingle(raw.selected).trim(),
  };

  const [managerRowsRes, accountsRowsRes, recentLogsRes] = await Promise.all([
    loadQueueRows(supabase, "manager_review"),
    loadQueueRows(supabase, "accounts_review"),
    supabase
      .from("approval_logs")
      .select("id, entity_id, action, created_at")
      .eq("entity_type", "demand_order")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (managerRowsRes.error) {
    throw new Error("Could not load manager approval queue.");
  }
  if (accountsRowsRes.error) {
    throw new Error("Could not load accounts approval queue.");
  }
  if (recentLogsRes.error) {
    throw new Error("Could not load approval activity.");
  }

  const managerRows = (managerRowsRes.data ?? []).map((row) =>
    mapDemandOrderRow(row as DemandOrderRow)
  );
  const accountsRows = (accountsRowsRes.data ?? []).map((row) =>
    mapDemandOrderRow(row as DemandOrderRow)
  );

  const allRows = [...managerRows, ...accountsRows];
  const orderIds = [...new Set(allRows.map((row) => row.id))];

  const logsByEntityId = new Map<string, ApprovalLogWithActors[]>();
  if (orderIds.length > 0) {
    const { data: logRows, error: logsError } = await supabase
      .from("approval_logs")
      .select(APPROVAL_LOG_ROW_SELECT)
      .eq("entity_type", "demand_order")
      .in("entity_id", orderIds)
      .order("created_at", { ascending: true });

    if (logsError) {
      throw new Error("Could not load approval timelines.");
    }

    for (const row of logRows ?? []) {
      const mapped = mapApprovalLogRow(row as ApprovalLogRow);
      const existing = logsByEntityId.get(mapped.entity_id);
      if (existing) {
        existing.push(mapped);
      } else {
        logsByEntityId.set(mapped.entity_id, [mapped]);
      }
    }
  }

  const managerActionableById = await computeManagerActionableMap({
    supabase,
    role,
    actorProfileId,
    rows: managerRows,
  });
  const accountsActionable = canPerformAccountsDemandOrderReview(role);

  const items = [
    ...managerRows.map((row) =>
      mapQueueItem({
        queue: "manager_review",
        row,
        latestLog: logsByEntityId.get(row.id)?.at(-1),
        isActionable: managerActionableById.get(row.id) ?? false,
      })
    ),
    ...accountsRows.map((row) =>
      mapQueueItem({
        queue: "accounts_review",
        row,
        latestLog: logsByEntityId.get(row.id)?.at(-1),
        isActionable: accountsActionable,
      })
    ),
  ];

  const filteredItems = items.filter((item) => matchesFilters(item, filters));
  const selectedId =
    filteredItems.find((item) => item.id === filters.selected)?.id ??
    filteredItems[0]?.id ??
    "";

  const selectedItem = filteredItems.find((item) => item.id === selectedId) ?? null;
  let selected: ApprovalWorkspaceDetail | null = null;

  if (selectedItem) {
    const { data: itemRows, error: itemsError } = await supabase
      .from("demand_order_items")
      .select(
        "id, demand_order_id, product_id, quantity, unit_price, line_total, remark, product:products!demand_order_items_product_id_fkey(product_name, item_code)"
      )
      .eq("demand_order_id", selectedItem.id)
      .order("id", { ascending: true });

    if (itemsError) {
      throw new Error("Could not load selected demand order items.");
    }

    const forwardTargets =
      selectedItem.queue === "manager_review" &&
      selectedItem.isActionable &&
      actorOrganizationId &&
      actorProfileId
        ? await loadDemandOrderForwardTargets(supabase, actorOrganizationId, [
            actorProfileId,
            allRows.find((row) => row.id === selectedItem.id)?.created_by_user_id ??
              actorProfileId,
          ])
        : [];

    selected = {
      item: selectedItem,
      timeline: logsByEntityId.get(selectedItem.id) ?? [],
      lineItems: (itemRows ?? []).map((row) =>
        mapDemandOrderItemRow(row as DemandOrderItemRow)
      ),
      forwardTargets,
    };
  }

  const recentDecisionCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentDecisions = (recentLogsRes.data ?? []).filter((log) => {
    if (
      log.action !== "approve" &&
      log.action !== "reject" &&
      log.action !== "accounts_approve" &&
      log.action !== "accounts_reject"
    ) {
      return false;
    }

    const createdAt = Date.parse(log.created_at);
    return Number.isFinite(createdAt) && createdAt >= recentDecisionCutoff;
  }).length;

  return {
    defaultQueue,
    filters: { ...filters, selected: selectedId },
    summary: {
      managerPending: managerRows.length,
      underReview: managerRows.filter((row) => row.status === "under_review").length,
      accountsQueue: accountsRows.length,
      recentDecisions,
    },
    tabs: [
      {
        key: "manager_review",
        label: QUEUE_LABELS.manager_review,
        description: QUEUE_DESCRIPTIONS.manager_review,
        count: managerRows.length,
      },
      {
        key: "accounts_review",
        label: QUEUE_LABELS.accounts_review,
        description: QUEUE_DESCRIPTIONS.accounts_review,
        count: accountsRows.length,
      },
    ],
    availableStatuses: ["submitted", "under_review", "approved"],
    availableActions: [...APPROVAL_LOG_ACTIONS],
    items: filteredItems,
    selected,
  };
}
