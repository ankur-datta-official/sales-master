import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { ListPageHeader, ListPageShell, ListSummaryRow } from "@/components/ui/list-page";
import { NativeSelect } from "@/components/ui/native-select";
import { RowActionLink } from "@/components/ui/row-action-link";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <ListPageShell>
      <ListPageHeader
        title="Demand orders"
        description="Multi-line demand orders. Submit when ready; hierarchy controls visibility."
        actions={
          canCreateDemandOrders(role) ? (
            <Link
              href={ROUTES.demandOrdersNew}
              className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
            >
              New order
            </Link>
          ) : null
        }
      />

      <ListSummaryRow
        left={
          rows.length === 1 ? "1 order" : `${rows.length} orders`
        }
        right={
          <span className="text-muted-foreground">
            Tip: use Scope to quickly switch between all vs own.
          </span>
        }
      />

      <form>
        <FilterBar
          actions={
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
            >
              Apply filters
            </button>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            <Input name="dateFrom" type="date" defaultValue={dateFrom} />
            <Input name="dateTo" type="date" defaultValue={dateTo} />
            <NativeSelect name="party" defaultValue={party}>
              <option value="">All parties</option>
              {partiesForFilter.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="status" defaultValue={status}>
              <option value="">All statuses</option>
              {DEMAND_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="scope" defaultValue={scope}>
              <option value="all">All (within visibility)</option>
              <option value="own">Own orders only</option>
              <option value="team">Team (RLS visibility)</option>
            </NativeSelect>
            <Input name="user" placeholder="Owner user id" defaultValue={user} />
          </div>
        </FilterBar>
      </form>

      <DataTable label="Demand orders table">
        <DataTableTable className="min-w-[1020px]">
          <DataTableHead>
            <tr>
              <DataTableHeaderCell>Order date</DataTableHeaderCell>
              <DataTableHeaderCell>Party</DataTableHeaderCell>
              <DataTableHeaderCell>Owner</DataTableHeaderCell>
              <DataTableHeaderCell align="right">Total</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Stage</DataTableHeaderCell>
              <DataTableHeaderCell>Submitted</DataTableHeaderCell>
              <DataTableHeaderCell className="w-24" />
            </tr>
          </DataTableHead>
          <DataTableBody>
            {rows.length === 0 ? (
              <DataTableEmptyRow colSpan={8}>No demand orders found.</DataTableEmptyRow>
            ) : (
              rows.map((row) => (
                <DataTableRow key={row.id}>
                  <DataTableCell className="font-mono text-xs text-muted-foreground">
                    {row.order_date}
                  </DataTableCell>
                  <DataTableCell>
                    <div className="font-medium">
                      {row.party_name ?? row.party_id}
                      {row.party_code ? (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">
                          ({row.party_code})
                        </span>
                      ) : null}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">
                    {row.creator_name ?? row.creator_email ?? row.created_by_user_id}
                  </DataTableCell>
                  <DataTableCell align="right" className="font-mono text-xs">
                    {row.total_amount}
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone="neutral" size="sm" className="capitalize">
                      {row.status}
                    </StatusBadge>
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone="neutral" size="sm" className="font-mono">
                      {row.stage}
                    </StatusBadge>
                  </DataTableCell>
                  <DataTableCell className="font-mono text-xs text-muted-foreground">
                    {row.submitted_at ? row.submitted_at.slice(0, 10) : "—"}
                  </DataTableCell>
                  <DataTableCell align="right">
                    <RowActionLink href={`${ROUTES.demandOrders}/${row.id}`} />
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTableTable>
      </DataTable>
    </ListPageShell>
  );
}
