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

  const role = resolveAppRole(user, profile);
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.demandOrders}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Demand orders
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Demand order</h1>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Status <span className="font-mono capitalize">{order.status}</span> · Stage{" "}
            <span className="font-mono">{order.stage}</span> · Total{" "}
            <span className="font-mono">{order.total_amount}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{order.creator_name ?? order.creator_email ?? order.created_by_user_id}</dd>
            <dt className="text-muted-foreground">Party</dt>
            <dd>
              {order.party_name ?? order.party_id}
              {order.party_code ? (
                <span className="text-muted-foreground ml-1 font-mono text-xs">
                  ({order.party_code})
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Order date</dt>
            <dd className="font-mono text-xs">{order.order_date}</dd>
            <dt className="text-muted-foreground">Stage</dt>
            <dd className="font-mono text-xs">{order.stage}</dd>
            <dt className="text-muted-foreground">Remarks</dt>
            <dd className="whitespace-pre-wrap">{order.remarks || "—"}</dd>
            <dt className="text-muted-foreground">Submitted at</dt>
            <dd className="font-mono text-xs">{order.submitted_at ?? "—"}</dd>
            <dt className="text-muted-foreground">Created at</dt>
            <dd>{order.created_at}</dd>
            <dt className="text-muted-foreground">Updated at</dt>
            <dd>{order.updated_at}</dd>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-medium">Line items</h3>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Unit price</th>
                    <th className="px-3 py-2 font-medium">Line total</th>
                    <th className="px-3 py-2 font-medium">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-muted-foreground px-3 py-6 text-center">
                        No line items.
                      </td>
                    </tr>
                  ) : (
                    items.map((line) => (
                      <tr key={line.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          {line.product_name ?? line.product_id}
                          {line.product_item_code ? (
                            <span className="text-muted-foreground ml-1 font-mono text-xs">
                              ({line.product_item_code})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{line.quantity}</td>
                        <td className="px-3 py-2 font-mono text-xs">{line.unit_price}</td>
                        <td className="px-3 py-2 font-mono text-xs">{line.line_total}</td>
                        <td className="px-3 py-2 text-muted-foreground">{line.remark || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ApprovalLogTimeline logs={approvalLogs} />
        </CardContent>
      </Card>

      {canSubmit && (
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle className="text-base">Submit</CardTitle>
            <CardDescription>
              Submitted orders cannot be edited. They enter the approval queue for reviewers in your
              hierarchy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmitDemandOrderButton demandOrderId={order.id} />
          </CardContent>
        </Card>
      )}

      {showReview && (
        <ReviewDemandOrderPanel
          demandOrderId={order.id}
          status={order.status}
          forwardTargets={forwardTargets}
        />
      )}

      {showAccountsReview && <AccountsReviewDemandOrderPanel demandOrderId={order.id} />}

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
    </div>
  );
}
