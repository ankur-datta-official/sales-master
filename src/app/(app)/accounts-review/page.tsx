import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canPerformAccountsDemandOrderReview } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapDemandOrderRow } from "@/modules/demand-orders/normalize";
import type { DemandOrderWithRelations } from "@/modules/demand-orders/types";

export default async function AccountsReviewQueuePage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canPerformAccountsDemandOrderReview(role)) {
    redirect(ROUTES.dashboard);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_orders")
    .select(
      "id, organization_id, party_id, created_by_user_id, order_date, status, stage, total_amount, remarks, submitted_at, created_at, updated_at, party:parties!demand_orders_party_id_fkey(name, code), creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email)"
    )
    .eq("stage", "accounts_review")
    .eq("status", "approved")
    .order("submitted_at", { ascending: true });

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts review</h1>
        <p className="text-destructive text-sm">Could not load queue: {error.message}</p>
      </div>
    );
  }

  const rows: DemandOrderWithRelations[] = (data ?? []).map((row) =>
    mapDemandOrderRow(row as Parameters<typeof mapDemandOrderRow>[0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts review</h1>
          <p className="text-muted-foreground text-sm">
            Manager-approved demand orders awaiting accounts. Approve to mark sent to factory or
            reject to stop the order.
          </p>
        </div>
        <Link
          href={ROUTES.demandOrders}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 items-center justify-center px-4")}
        >
          All demand orders
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Order date</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Submitted</th>
              <th className="px-3 py-2 w-24 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-3 py-8 text-center">
                  No orders waiting for accounts review.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.order_date}</td>
                  <td className="px-3 py-2 font-medium">
                    {row.party_name ?? row.party_id}
                    {row.party_code ? (
                      <span className="text-muted-foreground ml-1 font-mono text-xs">
                        ({row.party_code})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.creator_name ?? row.creator_email ?? row.created_by_user_id}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.total_amount}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.stage}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.submitted_at ? row.submitted_at.slice(0, 10) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.demandOrders}/${row.id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Review
                    </Link>
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
