import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCheckInOutOwnAttendance } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { TodayAttendancePanel } from "@/modules/attendance/components/today-attendance-panel";
import { mapAttendanceSessionRow } from "@/modules/attendance/normalize";
import type { AttendanceSession } from "@/modules/attendance/types";
import { getLastKnownLocationForUser } from "@/modules/location-pings/service";
import type { LocationPing } from "@/modules/location-pings/types";

export default async function AttendancePage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const canCheckInOut = canCheckInOutOwnAttendance(role);

  const supabase = await createClient();
  let activeSession: AttendanceSession | null = null;
  let lastKnownLocation: LocationPing | null = null;

  if (profile?.id) {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select(
        "id, organization_id, user_id, check_in_at, check_in_lat, check_in_lng, check_in_address, check_out_at, check_out_lat, check_out_lng, check_out_address, status, device_info, created_at, updated_at"
      )
      .eq("user_id", profile.id)
      .eq("status", "checked_in")
      .maybeSingle();

    if (!error && data) {
      activeSession = mapAttendanceSessionRow(data as Parameters<typeof mapAttendanceSessionRow>[0]);
    }
  }

  if (profile?.id) {
    const lastKnown = await getLastKnownLocationForUser(supabase, profile.id);
    if (lastKnown.ok) {
      lastKnownLocation = lastKnown.data;
    }
  }

  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground text-sm">{todayLabel}</p>
        </div>
        <Link
          href={ROUTES.attendanceHistory}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          History
        </Link>
      </div>

      <TodayAttendancePanel
        activeSession={activeSession}
        canCheckInOut={canCheckInOut}
        lastKnownLocation={lastKnownLocation}
      />
    </div>
  );
}
