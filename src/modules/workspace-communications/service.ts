import type { SupabaseClient } from "@supabase/supabase-js";

import type { StatusTone } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import type { AppRole } from "@/constants/roles";
import { getWorkspaceNotifications } from "@/modules/workspace-insights/service";

export type WorkspaceNotificationPreviewItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: StatusTone;
  href: string;
  isRead: boolean;
  kind: "workflow" | "message";
};

export type WorkspaceNotificationPreviewData = {
  unreadCount: number;
  items: WorkspaceNotificationPreviewItem[];
};

export type WorkspaceMessagePreviewItem = {
  id: string;
  subject: string;
  snippet: string;
  time: string;
  href: string;
  unreadCount: number;
  entityLabel: string;
};

export type WorkspaceMessagePreviewData = {
  unreadCount: number;
  items: WorkspaceMessagePreviewItem[];
};

export type MessageThreadSummary = {
  id: string;
  subject: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  href: string;
  lastMessageAt: string;
  unreadCount: number;
  lastSnippet: string;
};

export type MessageThreadParticipant = {
  userId: string;
  name: string;
  roleLabel: string;
};

export type MessageEntry = {
  id: string;
  body: string;
  messageType: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  isOwn: boolean;
};

export type MessageThreadDetail = {
  id: string;
  subject: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  entityHref: string;
  participants: MessageThreadParticipant[];
  entries: MessageEntry[];
};

export type WorkspaceActorContext = {
  userId: string;
  organizationId: string | null;
  role: AppRole | null;
  displayName: string;
};

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  href: string | null;
  tone: string | null;
  read_at: string | null;
  created_at: string;
};

type ApprovalLogSyncRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  note: string | null;
  created_at: string;
  from_user_id: string | null;
  to_user_id: string | null;
  acted_by_user_id: string;
};

type MessageThreadRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  subject: string;
  last_message_at: string;
};

type ParticipantRow = {
  thread_id: string;
  user_id: string;
  last_read_at: string | null;
};

type MessageEntryRow = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  body: string;
  message_type: string;
  created_at: string;
  sender?: Array<{ full_name?: string | null; email?: string | null }> | null;
};

const LEADERSHIP_ROLES = new Set<AppRole>(["admin", "hos", "manager", "assistant_manager"]);

function isLeadershipRole(role: AppRole | null | undefined) {
  return role ? LEADERSHIP_ROLES.has(role) : false;
}

function labelFromKey(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function toneFromStatus(status: string | null | undefined): StatusTone {
  const normalized = (status ?? "").toLowerCase();
  if (
    normalized.includes("approved") ||
    normalized.includes("delivered") ||
    normalized.includes("verified") ||
    normalized.includes("ready") ||
    normalized.includes("success")
  ) {
    return "success";
  }
  if (
    normalized.includes("reject") ||
    normalized.includes("failed") ||
    normalized.includes("overdue") ||
    normalized.includes("returned") ||
    normalized.includes("critical")
  ) {
    return "danger";
  }
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("hold")) {
    return "warning";
  }
  return "info";
}

function firstRelation<T>(value: T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : null;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(parsed);
}

function excerpt(value: string | null | undefined, fallback: string, max = 84) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

function normalizeEntityType(entityType: string | null | undefined) {
  const normalized = (entityType ?? "").toLowerCase().trim();
  if (["demand_order", "demand_orders", "order", "orders"].includes(normalized)) return "demand_order";
  if (["collection_entry", "collection_entries", "collection"].includes(normalized)) return "collection_entry";
  if (["dispatch", "demand_order_dispatch", "demand_order_dispatches"].includes(normalized)) return "dispatch";
  if (["work_plan", "work_plans"].includes(normalized)) return "work_plan";
  if (["work_report", "work_reports"].includes(normalized)) return "work_report";
  return null;
}

function entityHref(entityType: string, entityId: string) {
  switch (entityType) {
    case "demand_order":
      return `${ROUTES.demandOrders}/${entityId}`;
    case "collection_entry":
      return `${ROUTES.collectionEntries}/${entityId}`;
    case "dispatch":
      return `${ROUTES.factoryQueue}/${entityId}`;
    case "work_plan":
      return `${ROUTES.workPlans}/${entityId}`;
    case "work_report":
      return `${ROUTES.workReports}/${entityId}`;
    default:
      return ROUTES.messages;
  }
}

function entityLabel(entityType: string) {
  switch (entityType) {
    case "demand_order":
      return "Demand Order";
    case "collection_entry":
      return "Collection Entry";
    case "dispatch":
      return "Dispatch";
    case "work_plan":
      return "Work Plan";
    case "work_report":
      return "Work Report";
    default:
      return labelFromKey(entityType);
  }
}

async function safeRows<T>(
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

async function safeSingle<T>(
  promise: PromiseLike<{ data: T | null; error: { message?: string } | null }>
): Promise<T | null> {
  try {
    const { data, error } = await promise;
    if (error) return null;
    return data ?? null;
  } catch {
    return null;
  }
}

async function safeMutation(
  promise: PromiseLike<{ error: { message?: string } | null }>
): Promise<boolean> {
  try {
    const { error } = await promise;
    return !error;
  } catch {
    return false;
  }
}

async function syncWorkflowNotifications(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
}) {
  const { actor, service } = args;
  if (!actor.organizationId) return;

  const derived = await getWorkspaceNotifications({
    supabase: service,
    role: actor.role,
    userId: actor.userId,
    limit: 40,
  });

  if (derived.length === 0) return;

  await safeMutation(
    service.from("user_notifications").upsert(
      derived.map((notification) => ({
        organization_id: actor.organizationId,
        user_id: actor.userId,
        kind: "workflow",
        source_key: `workflow:${notification.id}`,
        title: notification.title,
        detail: notification.detail,
        href: notification.href,
        source_entity_type: null,
        source_entity_id: null,
        tone: notification.tone,
      })),
      { onConflict: "user_id,source_key" }
    )
  );
}

async function resolveWorkflowContext(
  service: SupabaseClient,
  entityType: string,
  entityId: string,
  organizationId: string
) {
  const normalized = normalizeEntityType(entityType);
  if (!normalized) {
    return {
      subject: `${labelFromKey(entityType)} • ${entityId.slice(0, 8)}`,
      href: ROUTES.messages,
      participantIds: [] as string[],
      label: labelFromKey(entityType),
    };
  }

  if (normalized === "demand_order") {
    const row = await safeSingle<{ created_by_user_id: string; party?: Array<{ name?: string | null }> | null }>(
      service
        .from("demand_orders")
        .select("created_by_user_id, party:parties(name)")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle()
    );
    return {
      subject: `Demand Order • ${firstRelation(row?.party)?.name ?? entityId.slice(0, 8)}`,
      href: entityHref(normalized, entityId),
      participantIds: row?.created_by_user_id ? [row.created_by_user_id] : [],
      label: entityLabel(normalized),
    };
  }

  if (normalized === "collection_entry") {
    const row = await safeSingle<{ user_id: string; party?: Array<{ name?: string | null }> | null }>(
      service
        .from("collection_entries")
        .select("user_id, party:parties(name)")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle()
    );
    return {
      subject: `Collection Entry • ${firstRelation(row?.party)?.name ?? entityId.slice(0, 8)}`,
      href: entityHref(normalized, entityId),
      participantIds: row?.user_id ? [row.user_id] : [],
      label: entityLabel(normalized),
    };
  }

  if (normalized === "dispatch") {
    const row = await safeSingle<{ updated_by: string | null; challan_no: string | null }>(
      service
        .from("demand_order_dispatches")
        .select("updated_by, challan_no")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle()
    );
    return {
      subject: `Dispatch • ${row?.challan_no ?? entityId.slice(0, 8)}`,
      href: entityHref(normalized, entityId),
      participantIds: row?.updated_by ? [row.updated_by] : [],
      label: entityLabel(normalized),
    };
  }

  if (normalized === "work_plan") {
    const row = await safeSingle<{ owner_user_id: string; reviewed_by: string | null; title: string }>(
      service
        .from("work_plans")
        .select("owner_user_id, reviewed_by, title")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle()
    );
    return {
      subject: `Work Plan • ${row?.title ?? entityId.slice(0, 8)}`,
      href: entityHref(normalized, entityId),
      participantIds: [row?.owner_user_id, row?.reviewed_by].filter(Boolean) as string[],
      label: entityLabel(normalized),
    };
  }

  const row = await safeSingle<{ owner_user_id: string; reviewed_by: string | null; summary: string }>(
    service
      .from("work_reports")
      .select("owner_user_id, reviewed_by, summary")
      .eq("organization_id", organizationId)
      .eq("id", entityId)
      .maybeSingle()
  );
  return {
    subject: `Work Report • ${row?.summary ?? entityId.slice(0, 8)}`,
    href: entityHref(normalized, entityId),
    participantIds: [row?.owner_user_id, row?.reviewed_by].filter(Boolean) as string[],
    label: entityLabel(normalized),
  };
}

async function ensureWorkflowThread(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
  entityType: string;
  entityId: string;
  extraParticipantIds?: string[];
}) {
  const normalized = normalizeEntityType(args.entityType);
  if (!normalized || !args.actor.organizationId) return null;

  const context = await resolveWorkflowContext(
    args.service,
    normalized,
    args.entityId,
    args.actor.organizationId
  );

  const thread = await safeSingle<{ id: string }>(
    args.service
      .from("message_threads")
      .upsert(
        {
          organization_id: args.actor.organizationId,
          entity_type: normalized,
          entity_id: args.entityId,
          subject: context.subject,
          created_by_user_id: args.actor.userId,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,entity_type,entity_id" }
      )
      .select("id")
      .single()
  );

  if (!thread) return null;

  const participantIds = Array.from(
    new Set(
      [args.actor.userId, ...(args.extraParticipantIds ?? []), ...context.participantIds].filter(Boolean)
    )
  );

  if (participantIds.length > 0) {
    await safeMutation(
      args.service.from("message_thread_participants").upsert(
        participantIds.map((participantId) => ({
          thread_id: thread.id,
          user_id: participantId,
        })),
        { onConflict: "thread_id,user_id" }
      )
    );
  }

  return {
    id: thread.id,
    subject: context.subject,
    entityType: normalized,
    entityId: args.entityId,
    entityHref: context.href,
    entityLabel: context.label,
  };
}

async function bootstrapThreadsFromApprovalLogs(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
}) {
  if (!args.actor.organizationId) return;

  const logs = await safeRows<ApprovalLogSyncRow>(
    args.service
      .from("approval_logs")
      .select("id, organization_id, entity_type, entity_id, action, note, created_at, from_user_id, to_user_id, acted_by_user_id")
      .eq("organization_id", args.actor.organizationId)
      .order("created_at", { ascending: true })
      .limit(80)
  );

  for (const log of logs) {
    const normalized = normalizeEntityType(log.entity_type);
    if (!normalized) continue;

    const thread = await ensureWorkflowThread({
      service: args.service,
      actor: args.actor,
      entityType: normalized,
      entityId: log.entity_id,
      extraParticipantIds: [log.from_user_id, log.to_user_id, log.acted_by_user_id].filter(Boolean) as string[],
    });

    if (!thread) continue;

    const entry = await safeSingle<{ id: string }>(
      args.service
        .from("message_entries")
        .upsert(
          {
            thread_id: thread.id,
            sender_user_id: log.acted_by_user_id,
            body: excerpt(log.note, `${labelFromKey(log.action)} update recorded.`, 240),
            message_type: "system",
            source_key: `approval-log:${log.id}`,
            created_at: log.created_at,
          },
          { onConflict: "source_key" }
        )
        .select("id")
        .single()
    );

    await safeMutation(
      args.service
        .from("message_threads")
        .update({ last_message_at: log.created_at })
        .eq("id", thread.id)
    );

    const participantIds = Array.from(
      new Set([log.from_user_id, log.to_user_id].filter(Boolean) as string[])
    );
    if (!entry || participantIds.length === 0) continue;

    await safeMutation(args.service.from("user_notifications").upsert(
      participantIds
        .filter((participantId) => participantId !== log.acted_by_user_id)
        .map((participantId) => ({
          organization_id: args.actor.organizationId,
          user_id: participantId,
          kind: "message",
          source_key: `message:${entry.id}:${participantId}`,
          title: `New workflow message • ${thread.subject}`,
          detail: excerpt(log.note, `${labelFromKey(log.action)} update was posted.`),
          href: `${ROUTES.messages}?threadId=${thread.id}`,
          source_entity_type: normalized,
          source_entity_id: log.entity_id,
          tone: toneFromStatus(log.action),
        })),
      { onConflict: "user_id,source_key" }
    ));
  }
}

async function getParticipantReadMap(service: SupabaseClient, threadIds: string[], userId: string) {
  if (threadIds.length === 0) return new Map<string, ParticipantRow>();
  const rows = await safeRows<ParticipantRow>(
    service
      .from("message_thread_participants")
      .select("thread_id, user_id, last_read_at")
      .eq("user_id", userId)
      .in("thread_id", threadIds)
  );
  return new Map(rows.map((row) => [row.thread_id, row]));
}

async function getLatestEntries(service: SupabaseClient, threadIds: string[]) {
  if (threadIds.length === 0) return new Map<string, MessageEntryRow>();
  const rows = await safeRows<MessageEntryRow>(
    service
      .from("message_entries")
      .select("id, thread_id, sender_user_id, body, message_type, created_at, sender:profiles!message_entries_sender_user_id_fkey(full_name, email)")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })
      .limit(Math.max(threadIds.length * 4, 20))
  );

  const map = new Map<string, MessageEntryRow>();
  for (const row of rows) {
    if (!map.has(row.thread_id)) map.set(row.thread_id, row);
  }
  return map;
}

export async function getWorkspaceNotificationPreview(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
}): Promise<WorkspaceNotificationPreviewData> {
  await syncWorkflowNotifications(args);

  const unreadRows = await safeRows<Pick<NotificationRow, "id">>(
    args.service
      .from("user_notifications")
      .select("id")
      .eq("user_id", args.actor.userId)
      .is("read_at", null)
  );
  const rows = await safeRows<NotificationRow>(
    args.service
      .from("user_notifications")
      .select("id, kind, title, detail, href, tone, read_at, created_at")
      .eq("user_id", args.actor.userId)
      .order("created_at", { ascending: false })
      .limit(5)
  );

  if (rows.length === 0) {
    const fallback = await getWorkspaceNotifications({
      supabase: args.service,
      role: args.actor.role,
      userId: args.actor.userId,
      limit: 5,
    });
    return {
      unreadCount: fallback.length,
      items: fallback.map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        time: item.time,
        tone: item.tone,
        href: item.href,
        isRead: false,
        kind: "workflow",
      })),
    };
  }

  return {
    unreadCount: unreadRows.length,
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      detail: row.detail ?? "",
      time: formatDateLabel(row.created_at),
      tone: toneFromStatus(row.tone ?? row.kind),
      href: row.href ?? ROUTES.notifications,
      isRead: Boolean(row.read_at),
      kind: row.kind === "message" ? "message" : "workflow",
    })),
  };
}

export async function getWorkspaceNotificationList(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
  unreadOnly?: boolean;
}): Promise<WorkspaceNotificationPreviewItem[]> {
  await syncWorkflowNotifications(args);

  let query = args.service
    .from("user_notifications")
    .select("id, kind, title, detail, href, tone, read_at, created_at")
    .eq("user_id", args.actor.userId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (args.unreadOnly) {
    query = query.is("read_at", null);
  }

  const rows = await safeRows<NotificationRow>(query);
  if (rows.length > 0) {
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      detail: row.detail ?? "",
      time: formatDateLabel(row.created_at),
      tone: toneFromStatus(row.tone ?? row.kind),
      href: row.href ?? ROUTES.notifications,
      isRead: Boolean(row.read_at),
      kind: row.kind === "message" ? "message" : "workflow",
    }));
  }

  const fallback = await getWorkspaceNotifications({
    supabase: args.service,
    role: args.actor.role,
    userId: args.actor.userId,
    limit: 20,
  });
  return fallback.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    time: item.time,
    tone: item.tone,
    href: item.href,
    isRead: false,
    kind: "workflow",
  }));
}

export async function getWorkspaceNotificationUnreadCount(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
}): Promise<number> {
  const preview = await getWorkspaceNotificationPreview(args);
  return preview.unreadCount;
}

export async function markNotificationRead(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
  notificationId: string;
}) {
  await args.service
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", args.notificationId)
    .eq("user_id", args.actor.userId);
}

export async function markAllNotificationsRead(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
  unreadOnly?: boolean;
}) {
  let query = args.service
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", args.actor.userId)
    .is("read_at", null);

  if (args.unreadOnly) {
    query = query.is("read_at", null);
  }
  await query;
}

export async function getWorkspaceMessageSummaries(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
}): Promise<MessageThreadSummary[]> {
  await bootstrapThreadsFromApprovalLogs(args);
  if (!args.actor.organizationId) return [];

  const participantRows = await safeRows<ParticipantRow>(
    args.service
      .from("message_thread_participants")
      .select("thread_id, user_id, last_read_at")
      .eq("user_id", args.actor.userId)
  );
  const participantThreadIds = participantRows.map((row) => row.thread_id);

  let threads: MessageThreadRow[] = [];
  if (isLeadershipRole(args.actor.role)) {
    threads = await safeRows<MessageThreadRow>(
      args.service
        .from("message_threads")
        .select("id, organization_id, entity_type, entity_id, subject, last_message_at")
        .eq("organization_id", args.actor.organizationId)
        .order("last_message_at", { ascending: false })
        .limit(40)
    );
  } else if (participantThreadIds.length > 0) {
    threads = await safeRows<MessageThreadRow>(
      args.service
        .from("message_threads")
        .select("id, organization_id, entity_type, entity_id, subject, last_message_at")
        .in("id", participantThreadIds)
        .order("last_message_at", { ascending: false })
        .limit(40)
    );
  }

  if (threads.length === 0) return [];

  const readMap = new Map(participantRows.map((row) => [row.thread_id, row]));
  const latestEntryMap = await getLatestEntries(args.service, threads.map((thread) => thread.id));

  return threads.map((thread) => {
    const participant = readMap.get(thread.id);
    const latestEntry = latestEntryMap.get(thread.id);
    const unread =
      participant && latestEntry && latestEntry.sender_user_id !== args.actor.userId
        ? (!participant.last_read_at || participant.last_read_at < thread.last_message_at ? 1 : 0)
        : 0;
    const normalizedEntityType = normalizeEntityType(thread.entity_type) ?? thread.entity_type;
    return {
      id: thread.id,
      subject: thread.subject,
      entityType: normalizedEntityType,
      entityId: thread.entity_id,
      entityLabel: entityLabel(normalizedEntityType),
      href: `${ROUTES.messages}?threadId=${thread.id}`,
      lastMessageAt: thread.last_message_at,
      unreadCount: unread,
      lastSnippet: excerpt(latestEntry?.body, "Open this thread to review the latest workflow context."),
    };
  });
}

export async function getWorkspaceMessagePreview(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
}): Promise<WorkspaceMessagePreviewData> {
  const summaries = await getWorkspaceMessageSummaries(args);
  return {
    unreadCount: summaries.reduce((sum, item) => sum + item.unreadCount, 0),
    items: summaries.slice(0, 5).map((item) => ({
      id: item.id,
      subject: item.subject,
      snippet: item.lastSnippet,
      time: formatDateLabel(item.lastMessageAt),
      href: item.href,
      unreadCount: item.unreadCount,
      entityLabel: item.entityLabel,
    })),
  };
}

export async function ensureWorkflowThreadForActor(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
  entityType: string;
  entityId: string;
}) {
  return ensureWorkflowThread(args);
}

export async function getMessageThreadDetail(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
  threadId: string;
}): Promise<MessageThreadDetail | null> {
  const thread = await safeSingle<MessageThreadRow>(
    args.service
      .from("message_threads")
      .select("id, organization_id, entity_type, entity_id, subject, last_message_at")
      .eq("id", args.threadId)
      .maybeSingle()
  );

  if (!thread) return null;
  if (thread.organization_id !== args.actor.organizationId) return null;

  const participant = await safeSingle<{ thread_id: string; user_id: string }>(
    args.service
      .from("message_thread_participants")
      .select("thread_id, user_id")
      .eq("thread_id", thread.id)
      .eq("user_id", args.actor.userId)
      .maybeSingle()
  );

  if (!participant && !isLeadershipRole(args.actor.role)) {
    return null;
  }

  if (!participant) {
    await args.service.from("message_thread_participants").upsert(
      {
        thread_id: thread.id,
        user_id: args.actor.userId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "thread_id,user_id" }
    );
  } else {
    await args.service
      .from("message_thread_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("thread_id", thread.id)
      .eq("user_id", args.actor.userId);
  }

  const participants = await safeRows<{
    user_id: string;
    profile?: Array<{ full_name?: string | null; email?: string | null; role?: string | null }> | null;
  }>(
    args.service
      .from("message_thread_participants")
      .select("user_id, profile:profiles!message_thread_participants_user_id_fkey(full_name, email, role)")
      .eq("thread_id", thread.id)
  );
  const entries = await safeRows<MessageEntryRow>(
    args.service
      .from("message_entries")
      .select("id, thread_id, sender_user_id, body, message_type, created_at, sender:profiles!message_entries_sender_user_id_fkey(full_name, email)")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true })
  );

  const normalizedEntityType = normalizeEntityType(thread.entity_type) ?? thread.entity_type;

  return {
    id: thread.id,
    subject: thread.subject,
    entityType: normalizedEntityType,
    entityId: thread.entity_id,
    entityLabel: entityLabel(normalizedEntityType),
    entityHref: entityHref(normalizedEntityType, thread.entity_id),
    participants: participants.map((row) => ({
      userId: row.user_id,
      name: firstRelation(row.profile)?.full_name ?? firstRelation(row.profile)?.email ?? "Team member",
      roleLabel: labelFromKey(firstRelation(row.profile)?.role ?? "participant"),
    })),
    entries: entries.map((entry) => ({
      id: entry.id,
      body: entry.body,
      messageType: entry.message_type,
      createdAt: entry.created_at,
      senderId: entry.sender_user_id,
      senderName: firstRelation(entry.sender)?.full_name ?? firstRelation(entry.sender)?.email ?? "Team member",
      isOwn: entry.sender_user_id === args.actor.userId,
    })),
  };
}

export async function sendWorkflowMessage(args: {
  service: SupabaseClient;
  actor: WorkspaceActorContext;
  threadId: string;
  body: string;
}) {
  const detail = await getMessageThreadDetail({
    service: args.service,
    actor: args.actor,
    threadId: args.threadId,
  });
  if (!detail) {
    return { ok: false as const, error: "You do not have access to this thread." };
  }

  const trimmed = args.body.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Message cannot be empty." };
  }

  const entry = await safeSingle<{ id: string; created_at: string }>(
    args.service
      .from("message_entries")
      .insert({
        thread_id: args.threadId,
        sender_user_id: args.actor.userId,
        body: trimmed,
        message_type: "reply",
      })
      .select("id, created_at")
      .single()
  );

  if (!entry) {
    return { ok: false as const, error: "Could not send the message." };
  }

  await args.service
    .from("message_threads")
    .update({ last_message_at: entry.created_at, updated_at: entry.created_at })
    .eq("id", args.threadId);

  await args.service
    .from("message_thread_participants")
    .update({ last_read_at: entry.created_at })
    .eq("thread_id", args.threadId)
    .eq("user_id", args.actor.userId);

  const recipientIds = detail.participants
    .map((participant) => participant.userId)
    .filter((participantId) => participantId !== args.actor.userId);

  if (recipientIds.length > 0 && args.actor.organizationId) {
    await args.service.from("user_notifications").upsert(
      recipientIds.map((recipientId) => ({
        organization_id: args.actor.organizationId,
        user_id: recipientId,
        kind: "message",
        source_key: `message:${entry.id}:${recipientId}`,
        title: `New message • ${detail.subject}`,
        detail: excerpt(trimmed, "Open the thread to review the latest reply."),
        href: `${ROUTES.messages}?threadId=${args.threadId}`,
        source_entity_type: detail.entityType,
        source_entity_id: detail.entityId,
        tone: "info",
      })),
      { onConflict: "user_id,source_key" }
    );
  }

  return { ok: true as const };
}
