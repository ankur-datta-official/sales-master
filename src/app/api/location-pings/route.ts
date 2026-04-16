import { NextResponse } from "next/server";

import { resolveAppRole } from "@/lib/auth/app-role";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
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
  if (!session.profile?.id) {
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
  const actorProfileId = session?.profile?.id;
  if (!session || !actorProfileId) {
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
    const { data: attendanceSession, error: attendanceSessionError } = await supabase
      .from("attendance_sessions")
      .select("user_id")
      .eq("id", parsed.data.attendance_session_id)
      .maybeSingle();
    if (attendanceSessionError || !attendanceSession) {
      return NextResponse.json({ error: "Attendance session not found." }, { status: 404 });
    }

    const isOwnSession = attendanceSession.user_id === actorProfileId;
    if (!isOwnSession) {
      if (!canFilterAttendanceHistoryByUser(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const canAccessUser = await rpcCanAccessProfile(
        supabase,
        actorProfileId,
        attendanceSession.user_id,
        role
      );
      if (!canAccessUser) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const result = await getRecentLocationPingsForSession(
      supabase,
      parsed.data.attendance_session_id,
      parsed.data.limit
    );
    if (!result.ok) {
      return NextResponse.json({ error: "Could not load session location history." }, { status: 400 });
    }
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
    if (parsed.data.user_id !== actorProfileId) {
      if (!canFilterAttendanceHistoryByUser(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const canAccessTarget = await rpcCanAccessProfile(
        supabase,
        actorProfileId,
        parsed.data.user_id,
        role
      );
      if (!canAccessTarget) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const result = await getLastKnownLocationForUser(supabase, parsed.data.user_id);
    if (!result.ok) {
      return NextResponse.json({ error: "Could not load last known location." }, { status: 400 });
    }
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
