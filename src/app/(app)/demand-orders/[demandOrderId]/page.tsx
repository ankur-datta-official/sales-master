import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ActionCard,
  DetailHeader,
  DetailPageShell,
  KV,
  KeyValueGrid,
  MetadataCard,
  Section,
  StatusPill,
} from "@/components/ui/detail-page";
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
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  canPerformAccountsDemandOrderReview,
  isOrgAdminRole,
} from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { ApprovalLogTimeline } from "@/modules/approval-logs/components/approval-log-timeline";
import { mapApprovalLogRow } from "@/modules/approval-logs/normalize";
import { APPROVAL_LOG_ROW_SELECT } from "@/modules/approval-logs/select-fields";
import { AccountsReviewDemandOrderPanel } from "@/modules/demand-orders/components/accounts-review-demand-order-panel";
import { EditDraftDemandOrderForm } from "@/modules/demand-orders/components/edit-draft-demand-order-form";
import { ReviewDemandOrderPanel } from "@/modules/demand-orders/components/review-demand-order-panel";
import { SubmitDemandOrderButton } from "@/modules/demand-orders/components/submit-demand-order-button";
import { loadDemandOrderForwardTargets } from "@/modules/demand-orders/load-forward-targets";
import { mapDemandOrderItemRow, mapDemandOrderRow } from "@/modules/demand-orders/normalize";
import { canActorReviewDemandOrder } from "@/modules/demand-orders/review-access";
import { canActorViewDemandOrder } from "@/modules/demand-orders/view-access";
import type { DemandOrderDetail } from "@/modules/demand-orders/types";

type PageProps = { params: Promise<{ demandOrderId: string }> };

function toPrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default async function DemandOrderDetailPage({ params }: PageProps) {
  const { demandOrderId } = await params;
  const { user, profile } = await requireUserProfile();

  const supabase = await createClient();
  const { data: headerRow, error: headerError } = await supabase
    .from("demand_orders")
    .select(
      "id, organization_id, party_id, created_by_user_id, order_date, status, stage, total_amount, remarks, submitted_at, created_at, updated_at, party:parties!demand_orders_party_id_fkey(name, code), creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email)"
    )
    .eq("id", demandOrderId)
    .maybeSingle();

  if (headerError || !headerRow) notFound();

  const header = mapDemandOrderRow(headerRow as Parameters<typeof mapDemandOrderRow>[0]);

  const role = resolveAppRole(user, profile);
  const actorProfileId = profile?.id;
  const actorOrganizationId = profile?.organization_id;
  if (!actorProfileId || !actorOrganizationId) {
    notFound();
  }
  const canViewOrder = await canActorViewDemandOrder(
    supabase,
    actorProfileId,
    actorOrganizationId,
    {
      organization_id: header.organization_id,
      created_by_user_id: header.created_by_user_id,
      stage: header.stage,
      status: header.status,
    },
    role
  );
  if (!canViewOrder) {
    notFound();
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from("demand_order_items")
    .select(
      "id, demand_order_id, product_id, quantity, unit_price, line_total, remark, product:products!demand_order_items_product_id_fkey(product_name, item_code)"
    )
    .eq("demand_order_id", demandOrderId)
    .order("id", { ascending: true });

  if (itemsError) notFound();

  const items = (itemRows ?? []).map((row) =>
    mapDemandOrderItemRow(row as Parameters<typeof mapDemandOrderItemRow>[0])
  );

  const order: DemandOrderDetail = { ...header, items };

  const { data: logRows } = await supabase
    .from("approval_logs")
    .select(APPROVAL_LOG_ROW_SELECT)
    .eq("entity_type", "demand_order")
    .eq("entity_id", demandOrderId)
    .order("created_at", { ascending: true });

  const approvalLogs = (logRows ?? []).map((row) =>
    mapApprovalLogRow(row as Parameters<typeof mapApprovalLogRow>[0])
  );

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const itemProductIds = [...new Set(items.map((i) => i.product_id))];
  const { data: activeProducts } = await supabase
    .from("products")
    .select("id, product_name, base_price")
    .eq("status", "active")
    .order("product_name", { ascending: true });

  const missingIds = itemProductIds.filter((id) => !(activeProducts ?? []).some((p) => p.id === id));
  const { data: extraProducts } =
    missingIds.length > 0
      ? await supabase
          .from("products")
          .select("id, product_name, base_price")
          .in("id", missingIds)
      : { data: [] };

  const productById = new Map<
    string,
    { id: string; product_name: string; base_price: unknown }
  >();
  for (const p of [...(activeProducts ?? []), ...(extraProducts ?? [])]) {
    productById.set(p.id, p);
  }
  const products = Array.from(productById.values())
    .map((p) => ({
      id: p.id,
      product_name: p.product_name,
      base_price: toPrice(p.base_price),
    }))
    .sort((a, b) => a.product_name.localeCompare(b.product_name));

  const isAdmin = isOrgAdminRole(role);

  const forwardTargets =
    profile?.organization_id && profile.id
      ? await loadDemandOrderForwardTargets(supabase, profile.organization_id, [
          profile.id,
          order.created_by_user_id,
        ])
      : [];

  const showReview =
    profile?.id != null &&
    order.stage === "manager_review" &&
    (order.status === "submitted" || order.status === "under_review") &&
    (await canActorReviewDemandOrder(supabase, profile.id, order.created_by_user_id, role));

  const showAccountsReview =
    canPerformAccountsDemandOrderReview(role) &&
    order.stage === "accounts_review" &&
    order.status === "approved";

  const canEditDraft =
    order.status === "draft" &&
    order.stage === "draft" &&
    (isAdmin || (profile?.id != null && profile.id === order.created_by_user_id));

  const canSubmit = canEditDraft && items.length > 0;

  return (
    <DetailPageShell>
      <DetailHeader
        backHref={ROUTES.demandOrders}
        backLabel="Demand orders"
        title="Demand order"
        description={
          <span className="text-sm text-muted-foreground">
            Total <span className="font-mono text-xs">{order.total_amount}</span>
          </span>
        }
        badges={
          <>
            <StatusPill tone="neutral">{order.status}</StatusPill>
            <StatusPill tone="neutral">{order.stage}</StatusPill>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <MetadataCard
          className="max-w-4xl"
          title="Summary"
          description={
            <span className="text-muted-foreground">
              Status <span className="font-mono text-xs capitalize">{order.status}</span> · Stage{" "}
              <span className="font-mono text-xs">{order.stage}</span>
            </span>
          }
        >
          <KeyValueGrid>
            <KV
              label="Owner"
              value={order.creator_name ?? order.creator_email ?? order.created_by_user_id}
            />
            <KV
              label="Party"
              value={
                <>
                  {order.party_name ?? order.party_id}
                  {order.party_code ? (
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      ({order.party_code})
                    </span>
                  ) : null}
                </>
              }
            />
            <KV label="Order date" value={order.order_date} mono />
            <KV label="Submitted at" value={order.submitted_at ?? "—"} mono />
            <KV label="Remarks" value={<span className="whitespace-pre-wrap">{order.remarks || "—"}</span>} />
            <KV label="Created at" value={order.created_at} subtle />
            <KV label="Updated at" value={order.updated_at} subtle />
          </KeyValueGrid>

          <Section title="Line items" description="Products and quantities in this order.">
            <DataTable label="Demand order line items">
              <DataTableTable className="min-w-[720px]">
                <DataTableHead>
                  <tr>
                    <DataTableHeaderCell>Product</DataTableHeaderCell>
                    <DataTableHeaderCell align="right">Qty</DataTableHeaderCell>
                    <DataTableHeaderCell align="right">Unit price</DataTableHeaderCell>
                    <DataTableHeaderCell align="right">Line total</DataTableHeaderCell>
                    <DataTableHeaderCell>Remark</DataTableHeaderCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {items.length === 0 ? (
                    <DataTableEmptyRow colSpan={5}>No line items.</DataTableEmptyRow>
                  ) : (
                    items.map((line) => (
                      <DataTableRow key={line.id}>
                        <DataTableCell>
                          <div className="font-medium">
                            {line.product_name ?? line.product_id}
                            {line.product_item_code ? (
                              <span className="ml-1 font-mono text-xs text-muted-foreground">
                                ({line.product_item_code})
                              </span>
                            ) : null}
                          </div>
                        </DataTableCell>
                        <DataTableCell align="right" className="font-mono text-xs">
                          {line.quantity}
                        </DataTableCell>
                        <DataTableCell align="right" className="font-mono text-xs">
                          {line.unit_price}
                        </DataTableCell>
                        <DataTableCell align="right" className="font-mono text-xs">
                          {line.line_total}
                        </DataTableCell>
                        <DataTableCell className="text-muted-foreground">
                          {line.remark || "—"}
                        </DataTableCell>
                      </DataTableRow>
                    ))
                  )}
                </DataTableBody>
              </DataTableTable>
            </DataTable>
          </Section>

          <Section title="Approval timeline" description="Audit trail of approval events.">
            <ApprovalLogTimeline logs={approvalLogs} title=" " />
          </Section>
        </MetadataCard>

        <div className="space-y-4">
          {canSubmit && (
            <ActionCard
              title="Submit"
              description="Submitted orders cannot be edited. They enter the approval queue for reviewers in your hierarchy."
            >
              <SubmitDemandOrderButton demandOrderId={order.id} />
            </ActionCard>
          )}

          {showReview && (
            <div className="rounded-xl border bg-card/60 shadow-[var(--shadow-xs)]">
              <ReviewDemandOrderPanel
                demandOrderId={order.id}
                status={order.status}
                forwardTargets={forwardTargets}
              />
            </div>
          )}

          {showAccountsReview && (
            <div className="rounded-xl border bg-card/60 shadow-[var(--shadow-xs)]">
              <AccountsReviewDemandOrderPanel demandOrderId={order.id} />
            </div>
          )}
        </div>
      </div>

      {canEditDraft && (
        <EditDraftDemandOrderForm order={order} parties={parties ?? []} products={products} />
      )}

      {!canEditDraft && (
        <p className="text-muted-foreground text-sm">
          {order.status !== "draft"
            ? "This order is not a draft and cannot be edited."
            : "You have read-only access to this order."}
        </p>
      )}
    </DetailPageShell>
  );
}
