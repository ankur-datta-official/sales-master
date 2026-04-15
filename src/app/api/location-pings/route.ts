import { NextResponse } from "next/server";

import { resolveAppRole } from "@/lib/auth/app-role";
import { getCurrentUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  canCheckInOutOwnAttendance,
  canFilterAttendanceHistoryByUser,
} from "@/lib/users/actor-permissions";
import {
  createLocationPingSchema,
  getLastKnownLocationSchema,
  listSessionLocationPingsSchema,
} from "@/modules/location-pings/schemas";
import {
  getLastKnownLocationForUser,
  getRecentLocationPingsForSession,
  recordLocationPing,
} from "@/modules/location-pings/service";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createLocationPingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const session = await getCurrentUserProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = resolveAppRole(session.user, session.profile);
  if (!canCheckInOutOwnAttendance(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await recordLocationPing(supabase, session, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ data: result.data }, { status: 201 });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const session = await getCurrentUserProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = resolveAppRole(session.user, session.profile);
  const url = new URL(req.url);

  const attendanceSessionId = url.searchParams.get("attendance_session_id");
  const userId = url.searchParams.get("user_id");
  const mode = url.searchParams.get("mode");
  const limitRaw = url.searchParams.get("limit");

  if (attendanceSessionId) {
    const parsed = listSessionLocationPingsSchema.safeParse({
      attendance_session_id: attendanceSessionId,
      limit: limitRaw ? Number(limitRaw) : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }
    const result = await getRecentLocationPingsForSession(
      supabase,
      parsed.data.attendance_session_id,
      parsed.data.limit
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: result.data });
  }

  if (mode === "last_known" && userId) {
    const parsed = getLastKnownLocationSchema.safeParse({ user_id: userId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }
    if (parsed.data.user_id !== session.profile?.id && !canFilterAttendanceHistoryByUser(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await getLastKnownLocationForUser(supabase, parsed.data.user_id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: result.data });
  }

  return NextResponse.json(
    {
      error:
        "Provide attendance_session_id for session points, or mode=last_known&user_id for last known location.",
    },
    { status: 400 }
  );
}
