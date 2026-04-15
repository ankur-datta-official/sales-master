import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { VISIT_PLAN_STATUSES } from "@/constants/statuses";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateVisitPlans } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapVisitPlanRow } from "@/modules/visit-plans/normalize";
import { isVisitPlanStatus } from "@/modules/visit-plans/schemas";
import type { VisitPlanWithRelations } from "@/modules/visit-plans/types";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    status?: string;
    scope?: string;
    user?: string;
    party?: string;
  }>;
};

export default async function VisitPlansPage({ searchParams }: PageProps) {
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
    .from("visit_plans")
    .select(
      "id, organization_id, party_id, user_id, visit_date, purpose, status, created_by, created_at, updated_at, party:parties!visit_plans_party_id_fkey(name, code), assignee:profiles!visit_plans_user_id_fkey(full_name, email), creator:profiles!visit_plans_created_by_fkey(full_name, email)"
    )
    .order("visit_date", { ascending: false });

  if (date) query = query.eq("visit_date", date);
  if (status && isVisitPlanStatus(status)) {
    query = query.eq("status", status);
  }
  if (party) query = query.eq("party_id", party);
  if (user) query = query.eq("user_id", user);
  if (scope === "own" && profile?.id) query = query.eq("user_id", profile.id);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Visit Plans</h1>
        <p className="text-destructive text-sm">Could not load visit plans: {error.message}</p>
      </div>
    );
  }

  const plans: VisitPlanWithRelations[] = (data ?? []).map((row) =>
    mapVisitPlanRow(row as Parameters<typeof mapVisitPlanRow>[0])
  );

  const partiesForFilter = partyOptions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visit Plans</h1>
          <p className="text-muted-foreground text-sm">
            Planned visits with outcomes. Visibility follows your role and hierarchy.
          </p>
        </div>
        {canCreateVisitPlans(role) && (
          <Link
            href={ROUTES.visitPlansNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New visit plan
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
          {VISIT_PLAN_STATUSES.map((s) => (
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
          <option value="own">Own visits only</option>
          <option value="team">Team (RLS visibility)</option>
        </select>
        <input
          name="user"
          placeholder="Assignee user id"
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
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Visit date</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Assignee</th>
              <th className="px-3 py-2 font-medium">Purpose</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created by</th>
              <th className="px-3 py-2 w-20 font-medium" />
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-3 py-8 text-center">
                  No visit plans found.
                </td>
              </tr>
            ) : (
              plans.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{p.visit_date}</td>
                  <td className="px-3 py-2 font-medium">
                    {p.party_name ?? p.party_id}
                    {p.party_code ? (
                      <span className="text-muted-foreground ml-1 font-mono text-xs">
                        ({p.party_code})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.assignee_name ?? p.assignee_email ?? p.user_id}
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-2 text-muted-foreground">
                    {p.purpose}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.creator_name ?? p.creator_email ?? p.created_by}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.visitPlans}/${p.id}`}
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
