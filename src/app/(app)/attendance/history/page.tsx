import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canFilterAttendanceHistoryByUser } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapAttendanceSessionWithUserRow } from "@/modules/attendance/normalize";
import type { AttendanceSessionWithUser } from "@/modules/attendance/types";

type PageProps = {
  searchParams: Promise<{
    user?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function AttendanceHistoryPage({ searchParams }: PageProps) {
  const { user = "", dateFrom = "", dateTo = "" } = await searchParams;

  const { user: authUser, profile } = await requireUserProfile();
  const role = resolveAppRole(authUser, profile);
  const canFilterUser = canFilterAttendanceHistoryByUser(role);

  const supabase = await createClient();

  let query = supabase
    .from("attendance_sessions")
    .select(
      "id, organization_id, user_id, check_in_at, check_in_lat, check_in_lng, check_in_address, check_out_at, check_out_lat, check_out_lng, check_out_address, status, device_info, created_at, updated_at, owner:profiles!attendance_sessions_user_id_fkey(full_name, email)"
    )
    .order("check_in_at", { ascending: false })
    .limit(300);

  if (dateFrom) {
    query = query.gte("check_in_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    query = query.lte("check_in_at", `${dateTo}T23:59:59.999Z`);
  }
  if (user && canFilterUser) {
    query = query.eq("user_id", user);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Attendance history</h1>
        <p className="text-destructive text-sm">Could not load history right now.</p>
      </div>
    );
  }

  const rows: AttendanceSessionWithUser[] = (data ?? []).map((row) =>
    mapAttendanceSessionWithUserRow(row as Parameters<typeof mapAttendanceSessionWithUserRow>[0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance history</h1>
          <p className="text-muted-foreground text-sm">
            Sessions visible to you follow role and reporting hierarchy.
          </p>
        </div>
        <Link
          href={ROUTES.attendance}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Today
        </Link>
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-5">
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
        {canFilterUser ? (
          <input
            name="user"
            placeholder="Filter by user id (optional)"
            defaultValue={user}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none lg:col-span-2"
          />
        ) : (
          <p className="text-muted-foreground flex items-center text-sm lg:col-span-2">
            Showing sessions in your visibility scope.
          </p>
        )}
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
              <th className="px-3 py-2 font-medium">Check in</th>
              <th className="px-3 py-2 font-medium">Check out</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 w-20 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-3 py-8 text-center">
                  No attendance sessions in this view.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {new Date(row.check_in_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {row.check_out_at ? new Date(row.check_out_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.user_name ?? row.user_email ?? row.user_id}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs capitalize">
                    {row.status.replaceAll("_", " ")}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.attendance}/${row.id}`}
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
