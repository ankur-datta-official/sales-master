import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { APPROVAL_LOG_ACTIONS } from "@/constants/statuses";
import { ROUTES } from "@/config/routes";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { mapApprovalLogRow } from "@/modules/approval-logs/normalize";
import { APPROVAL_LOG_ROW_SELECT } from "@/modules/approval-logs/select-fields";
import type { ApprovalLogWithActors } from "@/modules/approval-logs/types";

type PageProps = {
  searchParams: Promise<{
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

type OrderMeta = {
  id: string;
  order_date: string;
  status: string;
  stage: string;
  party: unknown;
  creator: unknown;
};

type PartyShape = { name: string | null };
type PersonShape = { full_name: string | null; email: string | null };

function pickParty(value: unknown): PartyShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as PartyShape) ?? null;
  return value as PartyShape;
}

function pickPerson(value: unknown): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as PersonShape) ?? null;
  return value as PersonShape;
}

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const { action = "", dateFrom = "", dateTo = "" } = await searchParams;

  await requireUserProfile();
  const supabase = await createClient();

  let query = supabase
    .from("approval_logs")
    .select(APPROVAL_LOG_ROW_SELECT)
    .eq("entity_type", "demand_order")
    .order("created_at", { ascending: false })
    .limit(400);

  if (action && APPROVAL_LOG_ACTIONS.includes(action as (typeof APPROVAL_LOG_ACTIONS)[number])) {
    query = query.eq("action", action);
  }

  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  const { data: logData, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-destructive text-sm">Could not load approval log right now.</p>
      </div>
    );
  }

  const logs: ApprovalLogWithActors[] = (logData ?? []).map((row) =>
    mapApprovalLogRow(row as Parameters<typeof mapApprovalLogRow>[0])
  );

  const orderIds = [...new Set(logs.map((l) => l.entity_id))];
  let orderById = new Map<string, OrderMeta>();

  if (orderIds.length > 0) {
    const { data: orderRows } = await supabase
      .from("demand_orders")
      .select(
        "id, order_date, status, stage, party:parties!demand_orders_party_id_fkey(name), creator:profiles!demand_orders_created_by_user_id_fkey(full_name, email)"
      )
      .in("id", orderIds);

    orderById = new Map((orderRows ?? []).map((o) => [o.id, o as OrderMeta]));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground text-sm">
          Timeline of demand order submissions and reviewer actions. Rows respect your visibility to
          each order.
        </p>
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          name="action"
          defaultValue={action}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All actions</option>
          {APPROVAL_LOG_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replaceAll("_", " ")}
            </option>
          ))}
        </select>
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
        <div className="flex gap-2 lg:col-span-2">
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 flex-1 px-4")}
          >
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-3 py-8 text-center">
                  No approval events in this view.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const meta = orderById.get(log.entity_id);
                const party = pickParty(meta?.party);
                const creator = pickPerson(meta?.creator);
                return (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{log.created_at}</td>
                    <td className="px-3 py-2 capitalize">{log.action.replaceAll("_", " ")}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {log.actor_name ?? log.actor_email ?? log.acted_by_user_id}
                    </td>
                    <td className="px-3 py-2">
                      {meta ? (
                        <Link
                          href={`${ROUTES.demandOrders}/${log.entity_id}`}
                          className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                        >
                          {meta.order_date} · {meta.status}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs">{log.entity_id}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {meta?.stage ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{party?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {creator?.full_name ?? creator?.email ?? "—"}
                    </td>
                    <td className="text-muted-foreground max-w-[240px] truncate px-3 py-2">
                      {log.note || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
