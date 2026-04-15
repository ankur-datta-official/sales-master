import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import {
  WORK_PLAN_PRIORITIES,
  WORK_PLAN_STATUSES,
} from "@/constants/statuses";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateWorkPlans } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapWorkPlanRow } from "@/modules/work-plans/normalize";
import type { WorkPlanWithPeople } from "@/modules/work-plans/types";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    status?: string;
    scope?: string;
    user?: string;
    priority?: string;
  }>;
};

export default async function WorkPlansPage({ searchParams }: PageProps) {
  const { date = "", status = "", scope = "all", user = "", priority = "" } = await searchParams;

  const supabase = await createClient();
  const { user: authUser, profile } = await requireUserProfile();
  const role = resolveAppRole(authUser, profile);

  let query = supabase
    .from("work_plans")
    .select(
      "id, organization_id, owner_user_id, plan_date, title, details, priority, status, submitted_at, reviewed_by, reviewed_at, review_note, created_at, updated_at, owner:profiles!work_plans_owner_user_id_fkey(full_name, email), reviewer:profiles!work_plans_reviewed_by_fkey(full_name, email)"
    )
    .order("plan_date", { ascending: false });

  if (date) query = query.eq("plan_date", date);
  if (status && WORK_PLAN_STATUSES.includes(status as (typeof WORK_PLAN_STATUSES)[number])) {
    query = query.eq("status", status);
  }
  if (
    priority &&
    WORK_PLAN_PRIORITIES.includes(priority as (typeof WORK_PLAN_PRIORITIES)[number])
  ) {
    query = query.eq("priority", priority);
  }
  if (user) query = query.eq("owner_user_id", user);
  if (scope === "own" && profile?.id) query = query.eq("owner_user_id", profile.id);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Work Plans</h1>
        <p className="text-destructive text-sm">Could not load work plans right now.</p>
      </div>
    );
  }

  const plans: WorkPlanWithPeople[] = (data ?? []).map((row) =>
    mapWorkPlanRow(row as Parameters<typeof mapWorkPlanRow>[0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Plans</h1>
          <p className="text-muted-foreground text-sm">
            Daily plan workflow with submit and review.
          </p>
        </div>
        {canCreateWorkPlans(role) && (
          <Link
            href={ROUTES.workPlansNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New work plan
          </Link>
        )}
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-5">
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
          {WORK_PLAN_STATUSES.map((s) => (
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
          <option value="all">all scope</option>
          <option value="own">own</option>
          <option value="team">team (via RLS visibility)</option>
        </select>
        <input
          name="user"
          placeholder="Owner user id"
          defaultValue={user}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <div className="flex gap-2">
          <select
            name="priority"
            defaultValue={priority}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          >
            <option value="">All priorities</option>
            {WORK_PLAN_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Reviewed by</th>
              <th className="px-3 py-2 font-medium w-20" />
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-3 py-8 text-center">
                  No work plans found.
                </td>
              </tr>
            ) : (
              plans.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{p.plan_date}</td>
                  <td className="px-3 py-2 font-medium">{p.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.owner_name ?? p.owner_email ?? p.owner_user_id}
                  </td>
                  <td className="px-3 py-2">{p.priority ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.reviewer_name ?? p.reviewer_email ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.workPlans}/${p.id}`}
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
