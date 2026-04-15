import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { WORK_REPORT_STATUSES } from "@/constants/statuses";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateWorkReports } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapWorkReportRow } from "@/modules/work-reports/normalize";
import {
  isValidWorkReportStatus,
} from "@/modules/work-reports/schemas";
import type { WorkReportWithPeople } from "@/modules/work-reports/types";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    status?: string;
    scope?: string;
    user?: string;
  }>;
};

export default async function WorkReportsPage({ searchParams }: PageProps) {
  const { date = "", status = "", scope = "all", user = "" } = await searchParams;

  const supabase = await createClient();
  const { user: authUser, profile } = await requireUserProfile();
  const role = resolveAppRole(authUser, profile);

  let query = supabase
    .from("work_reports")
    .select(
      "id, organization_id, owner_user_id, report_date, summary, achievements, challenges, next_step, status, submitted_at, reviewed_by, reviewed_at, review_note, created_at, updated_at, owner:profiles!work_reports_owner_user_id_fkey(full_name, email), reviewer:profiles!work_reports_reviewed_by_fkey(full_name, email)"
    )
    .order("report_date", { ascending: false });

  if (date) query = query.eq("report_date", date);
  if (status && isValidWorkReportStatus(status)) {
    query = query.eq("status", status);
  }
  if (user) query = query.eq("owner_user_id", user);
  if (scope === "own" && profile?.id) query = query.eq("owner_user_id", profile.id);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Work Reports</h1>
        <p className="text-destructive text-sm">Could not load work reports right now.</p>
      </div>
    );
  }

  const reports: WorkReportWithPeople[] = (data ?? []).map((row) =>
    mapWorkReportRow(row as Parameters<typeof mapWorkReportRow>[0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work Reports</h1>
          <p className="text-muted-foreground text-sm">
            Daily report workflow with submit and supervisor review.
          </p>
        </div>
        {canCreateWorkReports(role) && (
          <Link
            href={ROUTES.workReportsNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New work report
          </Link>
        )}
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-4">
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
          {WORK_REPORT_STATUSES.map((s) => (
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
        <div className="flex gap-2">
          <input
            name="user"
            placeholder="Owner user id"
            defaultValue={user}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          />
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
              <th className="px-3 py-2 font-medium">Summary</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Reviewed by</th>
              <th className="px-3 py-2 font-medium w-20" />
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-3 py-8 text-center">
                  No work reports found.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{r.report_date}</td>
                  <td className="px-3 py-2">
                    <p className="line-clamp-2">{r.summary}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.owner_name ?? r.owner_email ?? r.owner_user_id}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.reviewer_name ?? r.reviewer_email ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.workReports}/${r.id}`}
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
