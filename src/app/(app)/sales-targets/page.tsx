import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import {
  SALES_TARGET_PERIOD_TYPES,
  SALES_TARGET_STATUSES,
} from "@/constants/statuses";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canManageSalesTargets } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapSalesTargetRow } from "@/modules/sales-targets/normalize";
import {
  isSalesTargetPeriodType,
  isSalesTargetStatus,
} from "@/modules/sales-targets/schemas";
import type { SalesTargetWithRelations } from "@/modules/sales-targets/types";

type PageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    period?: string;
    party?: string;
    user?: string;
    scope?: string;
  }>;
};

export default async function SalesTargetsPage({ searchParams }: PageProps) {
  const {
    dateFrom = "",
    dateTo = "",
    status = "",
    period = "",
    party = "",
    user = "",
    scope = "all",
  } = await searchParams;

  const supabase = await createClient();
  const { user: authUser, profile } = await requireUserProfile();
  const role = resolveAppRole(authUser, profile);

  const { data: partyOptions } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  let query = supabase
    .from("sales_targets")
    .select(
      "id, organization_id, assigned_to_user_id, party_id, period_type, start_date, end_date, target_amount, target_qty, status, created_by, created_at, updated_at, party:parties!sales_targets_party_id_fkey(name, code), assignee:profiles!sales_targets_assigned_to_user_id_fkey(full_name, email), creator:profiles!sales_targets_created_by_fkey(full_name, email)"
    )
    .order("start_date", { ascending: false });

  if (dateFrom && dateTo) {
    query = query.lte("start_date", dateTo).gte("end_date", dateFrom);
  } else if (dateFrom) {
    query = query.gte("end_date", dateFrom);
  } else if (dateTo) {
    query = query.lte("start_date", dateTo);
  }

  if (status && isSalesTargetStatus(status)) {
    query = query.eq("status", status);
  }
  if (period && isSalesTargetPeriodType(period)) {
    query = query.eq("period_type", period);
  }
  if (party) query = query.eq("party_id", party);
  if (user) query = query.eq("assigned_to_user_id", user);
  if (scope === "own" && profile?.id) query = query.eq("assigned_to_user_id", profile.id);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sales targets</h1>
        <p className="text-destructive text-sm">Could not load sales targets: {error.message}</p>
      </div>
    );
  }

  const rows: SalesTargetWithRelations[] = (data ?? []).map((row) =>
    mapSalesTargetRow(row as Parameters<typeof mapSalesTargetRow>[0])
  );

  const partiesForFilter = partyOptions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales targets</h1>
          <p className="text-muted-foreground text-sm">
            Assigned goals by period. Date range filters targets that overlap the range. Marketers
            see only targets assigned to them.
          </p>
        </div>
        {canManageSalesTargets(role) && (
          <Link
            href={ROUTES.salesTargetsNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New target
          </Link>
        )}
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
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
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All statuses</option>
          {SALES_TARGET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="period"
          defaultValue={period}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All periods</option>
          {SALES_TARGET_PERIOD_TYPES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
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
          name="scope"
          defaultValue={scope}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="all">All (visibility)</option>
          <option value="own">Assigned to me</option>
        </select>
        <input
          name="user"
          placeholder="Assignee profile id"
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
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium">Dates</th>
              <th className="px-3 py-2 font-medium">Assignee</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created by</th>
              <th className="px-3 py-2 w-20 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-muted-foreground px-3 py-8 text-center">
                  No sales targets found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.period_type}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.start_date} → {row.end_date}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.assignee_name ?? row.assignee_email ?? row.assigned_to_user_id}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.party_name ?? (row.party_id ? row.party_id : "—")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.target_amount}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.target_qty != null ? row.target_qty : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.creator_name ?? row.creator_email ?? row.created_by}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.salesTargets}/${row.id}`}
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
