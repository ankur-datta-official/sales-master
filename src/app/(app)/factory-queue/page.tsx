import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canViewFactoryQueue } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapFactoryQueueListRow } from "@/modules/factory-dispatches/normalize";
import type { FactoryQueueListRow } from "@/modules/factory-dispatches/types";

export default async function FactoryQueuePage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canViewFactoryQueue(role)) {
    redirect(ROUTES.dashboard);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_orders")
    .select(
      "id, order_date, status, stage, total_amount, party_id, created_by_user_id, party:parties!demand_orders_party_id_fkey(name, code), creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email), demand_order_dispatches(id, organization_id, demand_order_id, factory_status, challan_no, memo_no, dispatch_date, remarks, updated_by, created_at, updated_at)"
    )
    .eq("stage", "factory_queue")
    .eq("status", "sent_to_factory")
    .order("order_date", { ascending: false });

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Factory queue</h1>
        <p className="text-destructive text-sm">Could not load factory queue: {error.message}</p>
      </div>
    );
  }

  const rows: FactoryQueueListRow[] = (data ?? []).map((row) =>
    mapFactoryQueueListRow(row as Parameters<typeof mapFactoryQueueListRow>[0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Factory queue</h1>
          <p className="text-muted-foreground text-sm">
            Demand orders released to factory. Dispatch records track challan, memo, and shipment
            progress.
          </p>
        </div>
        <Link
          href={ROUTES.demandOrders}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Demand orders
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Order date</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Factory status</th>
              <th className="px-3 py-2 font-medium">Challan</th>
              <th className="px-3 py-2 font-medium">Dispatch date</th>
              <th className="px-3 py-2 w-24 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-3 py-8 text-center">
                  No orders in the factory queue.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.order_id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.order_date}</td>
                  <td className="px-3 py-2 font-medium">
                    {row.party_name ?? row.order_id}
                    {row.party_code ? (
                      <span className="text-muted-foreground ml-1 font-mono text-xs">
                        ({row.party_code})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.creator_name ?? row.creator_email ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.total_amount}</td>
                  <td className="px-3 py-2 font-mono text-xs capitalize">
                    {row.dispatch?.factory_status.replaceAll("_", " ") ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.dispatch?.challan_no ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.dispatch?.dispatch_date ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.dispatch ? (
                      <Link
                        href={`${ROUTES.factoryQueue}/${row.dispatch.id}`}
                        className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                      >
                        Dispatch
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs">Syncing…</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
