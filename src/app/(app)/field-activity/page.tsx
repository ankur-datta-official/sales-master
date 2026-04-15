import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canViewFieldActivitySummary } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { fieldActivitySummaryFiltersSchema } from "@/modules/field-activity/schemas";
import { getActiveFieldUsersSummary } from "@/modules/field-activity/service";
import type { TrackingStatus } from "@/modules/field-activity/types";

type PageProps = {
  searchParams: Promise<{
    stale_minutes?: string;
    limit?: string;
  }>;
};

function trackingBadgeClass(status: TrackingStatus): string {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (status === "stale") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
}

function trackingLabel(status: TrackingStatus): string {
  if (status === "active") return "active";
  if (status === "stale") return "stale";
  return "no recent update";
}

export default async function FieldActivityPage({ searchParams }: PageProps) {
  const raw = await searchParams;

  const parsed = fieldActivitySummaryFiltersSchema.safeParse({
    stale_minutes: raw.stale_minutes,
    limit: raw.limit,
  });
  const filters = parsed.success
    ? parsed.data
    : fieldActivitySummaryFiltersSchema.parse({});

  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewFieldActivitySummary(role)) {
    redirect(ROUTES.dashboard);
  }

  const supabase = await createClient();
  const result = await getActiveFieldUsersSummary(supabase, {
    staleMinutes: filters.stale_minutes,
    limit: filters.limit,
  });

  if (!result.ok) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Field activity</h1>
        <p className="text-destructive text-sm">Could not load active field users: {result.error}</p>
      </div>
    );
  }

  const rows = result.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Field activity</h1>
          <p className="text-muted-foreground text-sm">
            Active attendance sessions with latest tracking updates in your hierarchy scope.
          </p>
        </div>
        <Link
          href={ROUTES.attendanceHistory}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 items-center px-4")}
        >
          Attendance history
        </Link>
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="stale_minutes"
          type="number"
          min={1}
          max={240}
          defaultValue={filters.stale_minutes}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          placeholder="Stale after minutes"
        />
        <input
          name="limit"
          type="number"
          min={1}
          max={500}
          defaultValue={filters.limit}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          placeholder="Max rows"
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
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Role / designation</th>
              <th className="px-3 py-2 font-medium">Check-in</th>
              <th className="px-3 py-2 font-medium">Session</th>
              <th className="px-3 py-2 font-medium">Last ping</th>
              <th className="px-3 py-2 font-medium">Last known location</th>
              <th className="px-3 py-2 font-medium">Tracking</th>
              <th className="px-3 py-2 w-24 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-3 py-8 text-center">
                  No active field users in your visibility scope.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.attendance_session_id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.user_name ?? row.user_email ?? row.user_id}</p>
                    <p className="text-muted-foreground font-mono text-xs">{row.user_id}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <p>{row.role_name ?? row.role_slug ?? "—"}</p>
                    <p className="text-xs">{row.designation ?? "—"}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {new Date(row.check_in_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 capitalize">{row.session_status.replaceAll("_", " ")}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.last_ping_at ? new Date(row.last_ping_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.last_ping_lat != null && row.last_ping_lng != null ? (
                      <span>
                        {row.last_ping_lat.toFixed(6)}, {row.last_ping_lng.toFixed(6)}
                        {row.last_ping_accuracy != null
                          ? ` (±${Math.round(row.last_ping_accuracy)}m)`
                          : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        trackingBadgeClass(row.tracking_status)
                      )}
                    >
                      {trackingLabel(row.tracking_status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.fieldActivity}/${row.user_id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Open
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
