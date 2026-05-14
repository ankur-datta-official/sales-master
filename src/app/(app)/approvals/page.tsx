import Link from "next/link";

import { AccountsReviewDemandOrderPanel } from "@/modules/demand-orders/components/accounts-review-demand-order-panel";
import { ReviewDemandOrderPanel } from "@/modules/demand-orders/components/review-demand-order-panel";
import { ApprovalLogTimeline } from "@/modules/approval-logs/components/approval-log-timeline";
import { getApprovalWorkspaceData } from "@/modules/approvals/service";
import type {
  ApprovalInboxItem,
  ApprovalWorkspaceFilters,
  ApprovalWorkspaceQueue,
} from "@/modules/approvals/types";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableTable,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { KV, KeyValueGrid, Section } from "@/components/ui/detail-page";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Factory,
  History,
  ListChecks,
  Search,
  ShoppingCart,
  UserRound,
  WalletMinimal,
} from "lucide-react";

type PageProps = {
  searchParams: Promise<{
    queue?: string;
    status?: string;
    action?: string;
    search?: string;
    selected?: string;
  }>;
};

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not submitted yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function toneFromStatus(status: string): StatusTone {
  if (status === "approved" || status === "sent_to_factory") return "success";
  if (status === "rejected") return "danger";
  if (status === "under_review") return "info";
  if (status === "submitted") return "warning";
  return "neutral";
}

function toneFromQueue(queue: ApprovalWorkspaceQueue): StatusTone {
  return queue === "accounts_review" ? "success" : "info";
}

function buildApprovalHref(
  filters: ApprovalWorkspaceFilters,
  patch: Partial<ApprovalWorkspaceFilters>
) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();

  if (next.queue) params.set("queue", next.queue);
  if (next.status) params.set("status", next.status);
  if (next.action) params.set("action", next.action);
  if (next.search) params.set("search", next.search);
  if (next.selected) params.set("selected", next.selected);

  const query = params.toString();
  return query ? `${ROUTES.approvals}?${query}` : ROUTES.approvals;
}

function QueueTab({
  label,
  description,
  href,
  count,
  active,
}: {
  label: string;
  description: string;
  href: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition-[transform,background-color,box-shadow,border-color]",
        "shadow-[var(--shadow-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-md)]",
        active
          ? "border-primary/25 bg-primary/10"
          : "border-border/80 bg-card/70 hover:border-primary/18 hover:bg-card/90"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{label}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <span
          className={cn(
            "inline-flex min-w-10 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold tabular-nums ring-1",
            active
              ? "bg-primary text-primary-foreground ring-primary/20"
              : "bg-background/70 text-foreground ring-border/80"
          )}
        >
          {count}
        </span>
      </div>
    </Link>
  );
}

function QueueRowTitle({ item }: { item: ApprovalInboxItem }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="truncate font-semibold tracking-tight">{item.title}</span>
        {item.partyCode ? (
          <span className="font-mono text-[0.7rem] text-muted-foreground">{item.partyCode}</span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {item.remarks || "No request note added yet."}
      </p>
    </div>
  );
}

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const supabase = await createClient();

  let workspace;
  try {
    workspace = await getApprovalWorkspaceData({
      supabase,
      role,
      actorProfileId: profile?.id ?? null,
      actorOrganizationId: profile?.organization_id ?? null,
      searchParams,
    });
  } catch (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load the approval workspace."}
        </p>
      </div>
    );
  }

  const selected = workspace.selected;
  const queueLabel =
    workspace.tabs.find((tab) => tab.key === workspace.filters.queue)?.label ?? "Approvals";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card/82 shadow-[var(--shadow-md)] backdrop-blur-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_48%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 size-72 rounded-full bg-primary/12 blur-3xl"
        />
        <div className="relative space-y-5 p-4 md:p-6">
          <PageHeader
            title="Approvals Workspace"
            description={`A focused review desk for ${queueLabel.toLowerCase()} tasks. Use queue filters on the left and keep context in the detail rail while you work.`}
            actions={
              <>
                <StatusBadge tone="info">{role ?? "viewer"}</StatusBadge>
                <Link
                  href={ROUTES.demandOrders}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
                >
                  <ShoppingCart />
                  All demand orders
                </Link>
              </>
            }
          />

          <div className="grid gap-3 lg:grid-cols-2">
            {workspace.tabs.map((tab) => (
              <QueueTab
                key={tab.key}
                label={tab.label}
                description={tab.description}
                count={tab.count}
                active={workspace.filters.queue === tab.key}
                href={buildApprovalHref(workspace.filters, {
                  queue: tab.key,
                  selected: "",
                })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pending manager review"
          value={workspace.summary.managerPending}
          hint="All submitted and forwarded orders still waiting in hierarchy review."
          tone="info"
          icon={<ListChecks />}
        />
        <KpiCard
          label="Forwarded / under review"
          value={workspace.summary.underReview}
          hint="Requests already escalated to deeper reviewer attention."
          tone="warning"
          icon={<BadgeCheck />}
        />
        <KpiCard
          label="Accounts queue"
          value={workspace.summary.accountsQueue}
          hint="Manager-approved requests waiting for accounts release."
          tone="success"
          icon={<Factory />}
        />
        <KpiCard
          label="Recent decisions (7d)"
          value={workspace.summary.recentDecisions}
          hint="Approvals and rejections recorded in the last seven days."
          tone="neutral"
          icon={<History />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <FilterBar
            actions={
              <>
                <Link
                  href={buildApprovalHref(workspace.filters, {
                    status: "",
                    action: "",
                    search: "",
                    selected: "",
                  })}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9")}
                >
                  Reset
                </Link>
                <button
                  type="submit"
                  form="approvals-filter-form"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 px-4")}
                >
                  Apply filters
                </button>
              </>
            }
          >
            <form
              id="approvals-filter-form"
              method="get"
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
            >
              <input type="hidden" name="queue" value={workspace.filters.queue} />
              <label className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Search
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    name="search"
                    defaultValue={workspace.filters.search}
                    placeholder="Search by ID, party, owner, or note"
                    className="h-10 w-full rounded-xl border border-input bg-background/60 pl-9 pr-3 text-sm shadow-[var(--shadow-xs)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={workspace.filters.status}
                  className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm shadow-[var(--shadow-xs)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
                >
                  <option value="">All statuses</option>
                  {workspace.availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {titleCase(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Latest action
                </span>
                <select
                  name="action"
                  defaultValue={workspace.filters.action}
                  className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm shadow-[var(--shadow-xs)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
                >
                  <option value="">All actions</option>
                  {workspace.availableActions.map((action) => (
                    <option key={action} value={action}>
                      {titleCase(action)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Workspace state
                </span>
                <div className="flex h-10 items-center rounded-xl border border-dashed border-border/80 bg-background/40 px-3 text-sm text-muted-foreground">
                  {workspace.items.length} visible request{workspace.items.length === 1 ? "" : "s"}
                </div>
              </div>
            </form>
          </FilterBar>

          <SectionCard
            title={`${queueLabel} Queue`}
            description="Review one item at a time without losing the rest of the queue."
            contentClassName="space-y-0"
          >
            <DataTable label="Approval queue">
              <DataTableTable className="min-w-[980px]">
                <DataTableHead>
                  <tr>
                    <DataTableHeaderCell>Request</DataTableHeaderCell>
                    <DataTableHeaderCell>Owner</DataTableHeaderCell>
                    <DataTableHeaderCell align="right">Amount</DataTableHeaderCell>
                    <DataTableHeaderCell>Submitted</DataTableHeaderCell>
                    <DataTableHeaderCell>Latest activity</DataTableHeaderCell>
                    <DataTableHeaderCell>Status</DataTableHeaderCell>
                    <DataTableHeaderCell align="right">Open</DataTableHeaderCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {workspace.items.length === 0 ? (
                    <DataTableEmptyRow colSpan={7}>
                      No requests matched the current approval filters.
                    </DataTableEmptyRow>
                  ) : (
                    workspace.items.map((item) => {
                      const href = buildApprovalHref(workspace.filters, {
                        selected: item.id,
                      });

                      return (
                        <DataTableRow
                          key={item.id}
                          className={cn(
                            selected?.item.id === item.id && "bg-primary/6 hover:bg-primary/8"
                          )}
                        >
                          <DataTableCell>
                            <Link href={href} className="block">
                              <div className="mb-2 flex items-center gap-2">
                                <StatusBadge tone={toneFromQueue(item.queue)} size="sm">
                                  {item.queue === "manager_review" ? "Manager" : "Accounts"}
                                </StatusBadge>
                                <span className="font-mono text-[0.72rem] text-muted-foreground">
                                  {item.id}
                                </span>
                              </div>
                              <QueueRowTitle item={item} />
                            </Link>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 flex size-8 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground ring-1 ring-border/70">
                                <UserRound className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{item.ownerLabel}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.ownerEmail ?? "Hierarchy scoped reviewer flow"}
                                </p>
                              </div>
                            </div>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <div className="inline-flex items-center gap-1 font-semibold tabular-nums text-foreground/90">
                              <WalletMinimal className="size-4 text-primary" />
                              {formatCurrency(item.amount)}
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <p className="text-sm font-medium">{formatDateTime(item.submittedAt)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Order date {item.orderDate}
                            </p>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {item.latestAction ? titleCase(item.latestAction) : "No activity"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.latestActorLabel ?? "System"}
                              </p>
                              {item.latestActionNote ? (
                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                  {item.latestActionNote}
                                </p>
                              ) : null}
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex flex-col items-start gap-1">
                              <StatusBadge tone={toneFromStatus(item.status)} size="sm">
                                {titleCase(item.status)}
                              </StatusBadge>
                              <StatusBadge tone="neutral" size="sm">
                                {titleCase(item.stage)}
                              </StatusBadge>
                            </div>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <Link
                              href={href}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              Open
                            </Link>
                          </DataTableCell>
                        </DataTableRow>
                      );
                    })
                  )}
                </DataTableBody>
              </DataTableTable>
            </DataTable>
          </SectionCard>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          {selected ? (
            <SectionCard
              title="Request Detail"
              description="Stay in context while reviewing the current request."
              actions={
                <StatusBadge tone={toneFromStatus(selected.item.status)}>
                  {titleCase(selected.item.status)}
                </StatusBadge>
              }
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/80 bg-background/50 p-4 shadow-[var(--shadow-xs)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={toneFromQueue(selected.item.queue)}>
                          {selected.item.queue === "manager_review"
                            ? "Manager review"
                            : "Accounts review"}
                        </StatusBadge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {selected.item.id}
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight">
                        {selected.item.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {selected.item.remarks || "No request note added yet."}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/15">
                      <ShoppingCart className="size-5" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <KeyValueGrid>
                      <KV label="Owner" value={selected.item.ownerLabel} />
                      <KV label="Amount" value={`BDT ${formatCurrency(selected.item.amount)}`} mono />
                      <KV label="Order date" value={selected.item.orderDate} mono />
                      <KV label="Submitted" value={formatDateTime(selected.item.submittedAt)} />
                      <KV label="Stage" value={titleCase(selected.item.stage)} />
                      <KV label="Latest action" value={selected.item.latestAction ? titleCase(selected.item.latestAction) : "No activity yet"} />
                    </KeyValueGrid>
                  </div>
                </div>

                <Section
                  title="Action desk"
                  description={
                    selected.item.isActionable
                      ? "Review and decide from here without leaving the queue."
                      : "This item is visible in your scope, but you do not currently have an action to take."
                  }
                  variant="surface"
                >
                  {selected.item.queue === "manager_review" && selected.item.isActionable ? (
                    <ReviewDemandOrderPanel
                      demandOrderId={selected.item.id}
                      status={selected.item.status}
                      forwardTargets={selected.forwardTargets}
                      variant="embedded"
                    />
                  ) : null}

                  {selected.item.queue === "accounts_review" && selected.item.isActionable ? (
                    <AccountsReviewDemandOrderPanel
                      demandOrderId={selected.item.id}
                      variant="embedded"
                    />
                  ) : null}

                  {!selected.item.isActionable ? (
                    <div className="rounded-2xl border border-dashed border-border/80 bg-background/35 p-4 text-sm text-muted-foreground">
                      Read-only context only. The current role can monitor this request, but approval
                      controls are not available here.
                    </div>
                  ) : null}
                </Section>

                <Section
                  title="Line items"
                  description="A quick summary of products attached to this request."
                  variant="surface"
                >
                  {selected.lineItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No line items were added.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.lineItems.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {line.product_name ?? line.product_id}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Qty {line.quantity} x {formatCurrency(line.unit_price)}
                            </p>
                          </div>
                          <span className="font-mono text-xs text-foreground/80">
                            {formatCurrency(line.line_total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section
                  title="Approval timeline"
                  description="Secondary audit trail for the selected request."
                  variant="surface"
                >
                  <ApprovalLogTimeline logs={selected.timeline} title=" " />
                </Section>
              </div>
            </SectionCard>
          ) : (
            <EmptyState
              icon={<ListChecks className="size-5" />}
              title="No request selected"
              description="Use the queue on the left to open a request, inspect its timeline, and take action from the detail rail."
            />
          )}
        </div>
      </div>
    </div>
  );
}
