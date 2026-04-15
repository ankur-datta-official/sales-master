import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { DEMAND_ORDER_STATUSES } from "@/constants/statuses";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateDemandOrders } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapDemandOrderRow } from "@/modules/demand-orders/normalize";
import type { DemandOrderWithRelations } from "@/modules/demand-orders/types";

type PageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    scope?: string;
    user?: string;
    party?: string;
    status?: string;
  }>;
};

export default async function DemandOrdersPage({ searchParams }: PageProps) {
  const {
    dateFrom = "",
    dateTo = "",
    scope = "all",
    user = "",
    party = "",
    status = "",
  } = await searchParams;

  const supabase = await createClient();
  const { user: authUser, profile } = await requireUserProfile();
  const role = resolveAppRole(authUser, profile);

  const { data: partyOptions } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  let query = supabase
    .from("demand_orders")
    .select(
      "id, organization_id, party_id, created_by_user_id, order_date, status, stage, total_amount, remarks, submitted_at, created_at, updated_at, party:parties!demand_orders_party_id_fkey(name, code), creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email)"
    )
    .order("order_date", { ascending: false });

  if (dateFrom && dateTo) {
    query = query.gte("order_date", dateFrom).lte("order_date", dateTo);
  } else if (dateFrom) {
    query = query.gte("order_date", dateFrom);
  } else if (dateTo) {
    query = query.lte("order_date", dateTo);
  }

  if (party) query = query.eq("party_id", party);
  if (user) query = query.eq("created_by_user_id", user);
  if (status && DEMAND_ORDER_STATUSES.includes(status as (typeof DEMAND_ORDER_STATUSES)[number])) {
    query = query.eq("status", status);
  }
  if (scope === "own" && profile?.id) query = query.eq("created_by_user_id", profile.id);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Demand orders</h1>
        <p className="text-destructive text-sm">Could not load demand orders right now.</p>
      </div>
    );
  }

  const rows: DemandOrderWithRelations[] = (data ?? []).map((row) =>
    mapDemandOrderRow(row as Parameters<typeof mapDemandOrderRow>[0])
  );

  const partiesForFilter = partyOptions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Demand orders</h1>
          <p className="text-muted-foreground text-sm">
            Multi-line demand orders. Submit when ready; hierarchy controls visibility.
          </p>
        </div>
        {canCreateDemandOrders(role) && (
          <Link
            href={ROUTES.demandOrdersNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New order
          </Link>
        )}
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-7">
        <input
          name="dateFrom"
          type="date"
          defaultValue={dateFrom}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <input
          name="dateTo"
          type="date"
          defaultValue={dateTo}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <select
          name="party"
          defaultValue={party}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All parties</option>
          {partiesForFilter.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All statuses</option>
          {DEMAND_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="scope"
          defaultValue={scope}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="all">All (within visibility)</option>
          <option value="own">Own orders only</option>
          <option value="team">Team (RLS visibility)</option>
        </select>
        <input
          name="user"
          placeholder="Owner user id"
          defaultValue={user}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 flex-1 px-4")}
          >
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Order date</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Submitted</th>
              <th className="px-3 py-2 w-20 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-3 py-8 text-center">
                  No demand orders found.
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
                  <td className="px-3 py-2 font-mono text-xs capitalize">{row.status}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.stage}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.submitted_at ? row.submitted_at.slice(0, 10) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.demandOrders}/${row.id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      View
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
