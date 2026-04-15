import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { VISIT_LOG_STATUSES } from "@/constants/statuses";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateVisitLogs } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapVisitLogRow } from "@/modules/visit-logs/normalize";
import { isVisitLogStatus } from "@/modules/visit-logs/schemas";
import type { VisitLogWithRelations } from "@/modules/visit-logs/types";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    status?: string;
    scope?: string;
    user?: string;
    party?: string;
  }>;
};

function endOfUtcDayIso(dateYmd: string): string {
  return `${dateYmd}T23:59:59.999Z`;
}

export default async function VisitLogsPage({ searchParams }: PageProps) {
  const {
    date = "",
    status = "",
    scope = "all",
    user = "",
    party = "",
  } = await searchParams;

  const supabase = await createClient();
  const { user: authUser, profile } = await requireUserProfile();
  const role = resolveAppRole(authUser, profile);

  const { data: partyOptions } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  let query = supabase
    .from("visit_logs")
    .select(
      "id, organization_id, party_id, user_id, visit_plan_id, check_in_time, check_out_time, check_in_lat, check_in_lng, check_out_lat, check_out_lng, notes, outcome, status, created_at, updated_at, party:parties!visit_logs_party_id_fkey(name, code), assignee:profiles!visit_logs_user_id_fkey(full_name, email), visit_plan:visit_plans!visit_logs_visit_plan_id_fkey(visit_date, purpose)"
    )
    .order("created_at", { ascending: false });

  if (date) {
    query = query
      .gte("created_at", `${date}T00:00:00.000Z`)
      .lte("created_at", endOfUtcDayIso(date));
  }
  if (status && isVisitLogStatus(status)) {
    query = query.eq("status", status);
  }
  if (party) query = query.eq("party_id", party);
  if (user) query = query.eq("user_id", user);
  if (scope === "own" && profile?.id) query = query.eq("user_id", profile.id);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Visit logs</h1>
        <p className="text-destructive text-sm">Could not load visit logs right now.</p>
      </div>
    );
  }

  const logs: VisitLogWithRelations[] = (data ?? []).map((row) =>
    mapVisitLogRow(row as Parameters<typeof mapVisitLogRow>[0])
  );

  const partiesForFilter = partyOptions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visit logs</h1>
          <p className="text-muted-foreground text-sm">
            Field visit records. Date filter uses log creation time (UTC day). Visibility follows
            your role and hierarchy.
          </p>
        </div>
        {canCreateVisitLogs(role) && (
          <Link
            href={ROUTES.visitLogsNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New visit log
          </Link>
        )}
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-6">
        <input
          name="date"
          type="date"
          defaultValue={date}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All statuses</option>
          {VISIT_LOG_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
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
          <option value="all">All (within visibility)</option>
          <option value="own">Own logs only</option>
          <option value="team">Team (RLS visibility)</option>
        </select>
        <input
          name="user"
          placeholder="User id (visitor)"
          defaultValue={user}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <div className="flex gap-2 lg:col-span-1">
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
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Visitor</th>
              <th className="px-3 py-2 font-medium">Outcome</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Plan link</th>
              <th className="px-3 py-2 w-20 font-medium" />
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-3 py-8 text-center">
                  No visit logs found.
                </td>
              </tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.created_at}</td>
                  <td className="px-3 py-2 font-medium">
                    {row.party_name ?? row.party_id}
                    {row.party_code ? (
                      <span className="text-muted-foreground ml-1 font-mono text-xs">
                        ({row.party_code})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.assignee_name ?? row.assignee_email ?? row.user_id}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-muted-foreground">
                    {row.outcome || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.status}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.visit_plan_id ? (row.visit_plan_visit_date ?? row.visit_plan_id) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.visitLogs}/${row.id}`}
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
