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
import { canUpdateFactoryDispatch, canViewFactoryQueue } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { EditFactoryDispatchForm } from "@/modules/factory-dispatches/components/edit-factory-dispatch-form";
import { mapFactoryDispatchDetailRow } from "@/modules/factory-dispatches/normalize";
import type { FactoryDispatchDetail } from "@/modules/factory-dispatches/types";

type PageProps = { params: Promise<{ dispatchId: string }> };

export default async function FactoryDispatchDetailPage({ params }: PageProps) {
  const { dispatchId } = await params;
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canViewFactoryQueue(role)) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_order_dispatches")
    .select(
      "id, organization_id, demand_order_id, factory_status, challan_no, memo_no, dispatch_date, remarks, updated_by, created_at, updated_at, demand_order:demand_orders!demand_order_dispatches_demand_order_id_fkey(order_date, status, stage, party_id, created_by_user_id, total_amount, remarks, party:parties!demand_orders_party_id_fkey(name, code), creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email)), updater:profiles!demand_order_dispatches_updated_by_fkey(full_name, email)"
    )
    .eq("id", dispatchId)
    .maybeSingle();

  if (error || !data) notFound();

  let detail: FactoryDispatchDetail;
  try {
    detail = mapFactoryDispatchDetailRow(data as Record<string, unknown>);
  } catch {
    notFound();
  }

  if (detail.order_stage !== "factory_queue" || detail.order_status !== "sent_to_factory") {
    notFound();
  }

  const canEdit = canUpdateFactoryDispatch(role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.factoryQueue}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Factory queue
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Factory dispatch</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
          <CardDescription>Demand order linked to this dispatch record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Demand order</dt>
            <dd>
              <Link
                href={`${ROUTES.demandOrders}/${detail.demand_order_id}`}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                View order
              </Link>
            </dd>
            <dt className="text-muted-foreground">Order date</dt>
            <dd className="font-mono text-xs">{detail.order_date}</dd>
            <dt className="text-muted-foreground">Party</dt>
            <dd>
              {detail.party_name ?? detail.party_id}
              {detail.party_code ? (
                <span className="text-muted-foreground ml-1 font-mono text-xs">
                  ({detail.party_code})
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Owner</dt>
            <dd className="text-muted-foreground">
              {detail.creator_name ?? detail.creator_email ?? detail.created_by_user_id}
            </dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-mono text-xs">{detail.order_total_amount}</dd>
            <dt className="text-muted-foreground">Order remarks</dt>
            <dd className="whitespace-pre-wrap">{detail.order_remarks || "—"}</dd>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-mono text-xs">{detail.updated_at}</dd>
            <dt className="text-muted-foreground">Updated by</dt>
            <dd className="text-muted-foreground">
              {detail.updater_name ?? detail.updater_email ?? detail.updated_by ?? "—"}
            </dd>
          </dl>
        </CardContent>
      </Card>

      {canEdit ? (
        <EditFactoryDispatchForm dispatch={detail} />
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dispatch details</CardTitle>
            <CardDescription>Read-only for your role.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
              <dt className="text-muted-foreground">Factory status</dt>
              <dd className="capitalize">{detail.factory_status.replaceAll("_", " ")}</dd>
              <dt className="text-muted-foreground">Challan no.</dt>
              <dd className="font-mono text-xs">{detail.challan_no ?? "—"}</dd>
              <dt className="text-muted-foreground">Memo no.</dt>
              <dd className="font-mono text-xs">{detail.memo_no ?? "—"}</dd>
              <dt className="text-muted-foreground">Dispatch date</dt>
              <dd className="font-mono text-xs">{detail.dispatch_date ?? "—"}</dd>
              <dt className="text-muted-foreground">Remarks</dt>
              <dd className="whitespace-pre-wrap">{detail.remarks || "—"}</dd>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
