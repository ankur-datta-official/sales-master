import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { mapAttendanceSessionWithUserRow } from "@/modules/attendance/normalize";
import type { AttendanceSessionWithUser } from "@/modules/attendance/types";
import { getRecentLocationPingsForSession } from "@/modules/location-pings/service";
import type { LocationPing } from "@/modules/location-pings/types";

type PageProps = { params: Promise<{ sessionId: string }> };

export default async function AttendanceSessionDetailPage({ params }: PageProps) {
  const { sessionId } = await params;
  const { user, profile } = await requireUserProfile();
  const actorProfileId = profile?.id;
  if (!actorProfileId) {
    redirect(ROUTES.login);
  }
  const role = resolveAppRole(user, profile);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select(
      "id, organization_id, user_id, check_in_at, check_in_lat, check_in_lng, check_in_address, check_out_at, check_out_lat, check_out_lng, check_out_address, status, device_info, created_at, updated_at, owner:profiles!attendance_sessions_user_id_fkey(full_name, email)"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) notFound();

  const session: AttendanceSessionWithUser = mapAttendanceSessionWithUserRow(
    data as Parameters<typeof mapAttendanceSessionWithUserRow>[0]
  );

  const canViewSession = await rpcCanAccessProfile(
    supabase,
    actorProfileId,
    session.user_id,
    role
  );
  if (!canViewSession) {
    notFound();
  }

  let recentPings: LocationPing[] = [];
  const pingsResult = await getRecentLocationPingsForSession(supabase, session.id, 20);
  if (pingsResult.ok) recentPings = pingsResult.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.attendanceHistory}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← History
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance session</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Check-in and check-out record.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">User</dt>
            <dd>{session.user_name ?? session.user_email ?? session.user_id}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{session.status.replaceAll("_", " ")}</dd>
            <dt className="text-muted-foreground">Check in</dt>
            <dd className="font-mono text-xs">{new Date(session.check_in_at).toLocaleString()}</dd>
            <dt className="text-muted-foreground">Check in location</dt>
            <dd className="font-mono text-xs">
              {session.check_in_lat != null && session.check_in_lng != null
                ? `${session.check_in_lat}, ${session.check_in_lng}`
                : "—"}
              {session.check_in_address ? (
                <span className="text-muted-foreground mt-1 block whitespace-pre-wrap">
                  {session.check_in_address}
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Check out</dt>
            <dd className="font-mono text-xs">
              {session.check_out_at
                ? new Date(session.check_out_at).toLocaleString()
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Check out location</dt>
            <dd className="font-mono text-xs">
              {session.check_out_lat != null && session.check_out_lng != null
                ? `${session.check_out_lat}, ${session.check_out_lng}`
                : "—"}
              {session.check_out_address ? (
                <span className="text-muted-foreground mt-1 block whitespace-pre-wrap">
                  {session.check_out_address}
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Device (check-in)</dt>
            <dd className="text-muted-foreground break-all text-xs">{session.device_info || "—"}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-mono text-xs">{session.created_at}</dd>
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="font-mono text-xs">{session.updated_at}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Recent location points</CardTitle>
          <CardDescription>Sampled pings captured while this session is active.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No location points recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-2 py-2 font-medium">Captured</th>
                    <th className="px-2 py-2 font-medium">Lat</th>
                    <th className="px-2 py-2 font-medium">Lng</th>
                    <th className="px-2 py-2 font-medium">Accuracy</th>
                    <th className="px-2 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPings.map((ping) => (
                    <tr key={ping.id} className="border-b last:border-0">
                      <td className="px-2 py-2 font-mono text-xs">
                        {new Date(ping.captured_at).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">{ping.lat}</td>
                      <td className="px-2 py-2 font-mono text-xs">{ping.lng}</td>
                      <td className="px-2 py-2 font-mono text-xs">
                        {ping.accuracy != null ? Math.round(ping.accuracy) : "—"}
                      </td>
                      <td className="px-2 py-2 capitalize">{ping.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
