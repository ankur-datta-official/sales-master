import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getLastKnownLocationForUser,
  getRecentLocationPingsForSession,
} from "@/modules/location-pings/service";
import type {
  ActiveFieldUserSummary,
  FieldActivityTimelineItem,
  FieldActivityUserDetail,
  TrackingStatus,
} from "@/modules/field-activity/types";

type SessionRow = {
  id: string;
  user_id: string;
  check_in_at: string;
  status: "checked_in";
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  designation: string | null;
  role:
    | { name: string | null; slug: string | null }
    | { name: string | null; slug: string | null }[]
    | null;
};

type PingRow = {
  attendance_session_id: string;
  captured_at: string;
  lat: number;
  lng: number;
  accuracy: number | null;
};

function resolveTrackingStatus(
  lastPingAt: string | null,
  staleMinutes: number
): TrackingStatus {
  if (!lastPingAt) return "no_recent_update";
  const diffMs = Date.now() - new Date(lastPingAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "active";

  const staleMs = staleMinutes * 60 * 1000;
  const noRecentMs = Math.max(staleMs * 3, 30 * 60 * 1000);

  if (diffMs <= staleMs) return "active";
  if (diffMs <= noRecentMs) return "stale";
  return "no_recent_update";
}

function pickRole(
  value: ProfileRow["role"]
): { name: string | null; slug: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function getActiveFieldUsersSummary(
  supabase: SupabaseClient,
  options?: { staleMinutes?: number; limit?: number }
): Promise<{ ok: true; data: ActiveFieldUserSummary[] } | { ok: false; error: string }> {
  const staleMinutes = options?.staleMinutes ?? 10;
  const limit = options?.limit ?? 200;

  const { data: sessionData, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id, user_id, check_in_at, status")
    .eq("status", "checked_in")
    .is("check_out_at", null)
    .order("check_in_at", { ascending: true })
    .limit(limit);

  if (sessionError) return { ok: false, error: sessionError.message };
  const sessions = (sessionData ?? []) as SessionRow[];
  if (!sessions.length) return { ok: true, data: [] };

  const userIds = [...new Set(sessions.map((s) => s.user_id))];
  const sessionIds = sessions.map((s) => s.id);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, designation, role:roles!profiles_role_id_fkey(name, slug)")
    .in("id", userIds);

  if (profileError) return { ok: false, error: profileError.message };
  const profileById = new Map<string, ProfileRow>();
  for (const row of (profileData ?? []) as ProfileRow[]) {
    profileById.set(row.id, row);
  }

  const { data: pingData, error: pingError } = await supabase
    .from("location_pings")
    .select("attendance_session_id, captured_at, lat, lng, accuracy")
    .in("attendance_session_id", sessionIds)
    .order("captured_at", { ascending: false })
    .limit(Math.max(limit * 10, 1000));

  if (pingError) return { ok: false, error: pingError.message };
  const latestPingBySessionId = new Map<string, PingRow>();
  for (const row of (pingData ?? []) as PingRow[]) {
    if (!latestPingBySessionId.has(row.attendance_session_id)) {
      latestPingBySessionId.set(row.attendance_session_id, row);
    }
  }

  const rows: ActiveFieldUserSummary[] = sessions.map((session) => {
    const profile = profileById.get(session.user_id) ?? null;
    const role = pickRole(profile?.role ?? null);
    const ping = latestPingBySessionId.get(session.id) ?? null;
    const lastPingAt = ping?.captured_at ?? null;
    return {
      user_id: session.user_id,
      user_name: profile?.full_name ?? null,
      user_email: profile?.email ?? null,
      role_name: role?.name ?? null,
      role_slug: role?.slug ?? null,
      designation: profile?.designation ?? null,
      attendance_session_id: session.id,
      check_in_at: session.check_in_at,
      session_status: "checked_in",
      last_ping_at: lastPingAt,
      last_ping_lat: ping?.lat ?? null,
      last_ping_lng: ping?.lng ?? null,
      last_ping_accuracy: ping?.accuracy ?? null,
      tracking_status: resolveTrackingStatus(lastPingAt, staleMinutes),
    };
  });

  return { ok: true, data: rows };
}

type SessionDetailRow = {
  id: string;
  user_id: string;
  status: "checked_in" | "checked_out" | "missed_checkout";
  check_in_at: string;
  check_out_at: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  owner:
    | {
        full_name: string | null;
        email: string | null;
        designation: string | null;
        role:
          | { name: string | null; slug: string | null }
          | { name: string | null; slug: string | null }[]
          | null;
      }
    | {
        full_name: string | null;
        email: string | null;
        designation: string | null;
        role:
          | { name: string | null; slug: string | null }
          | { name: string | null; slug: string | null }[]
          | null;
      }[]
    | null;
};

function pickOwner(
  value: SessionDetailRow["owner"]
): {
  full_name: string | null;
  email: string | null;
  designation: string | null;
  role:
    | { name: string | null; slug: string | null }
    | { name: string | null; slug: string | null }[]
    | null;
} | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function buildTimeline(
  session: SessionDetailRow,
  points: {
    id: string;
    captured_at: string;
    lat: number;
    lng: number;
    accuracy: number | null;
    source: string;
  }[],
  limit: number
): FieldActivityTimelineItem[] {
  const items: FieldActivityTimelineItem[] = [
    {
      id: `session-checkin-${session.id}`,
      type: "check_in",
      at: session.check_in_at,
      title: "Checked in",
      description: "Attendance session started.",
    },
  ];

  if (session.check_out_at) {
    items.push({
      id: `session-checkout-${session.id}`,
      type: "check_out",
      at: session.check_out_at,
      title: "Checked out",
      description: "Attendance session closed.",
    });
  }

  for (const p of points.slice(0, limit)) {
    items.push({
      id: `ping-${p.id}`,
      type: "location_ping",
      at: p.captured_at,
      title: "Location ping",
      description: `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}${
        p.accuracy != null ? ` (±${Math.round(p.accuracy)}m)` : ""
      }`,
    });
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}

export async function getFieldActivityUserDetail(
  supabase: SupabaseClient,
  userId: string,
  options?: { staleMinutes?: number; pointsLimit?: number; timelineLimit?: number }
): Promise<{ ok: true; data: FieldActivityUserDetail | null } | { ok: false; error: string }> {
  const staleMinutes = options?.staleMinutes ?? 10;
  const pointsLimit = options?.pointsLimit ?? 40;
  const timelineLimit = options?.timelineLimit ?? 30;

  const sessionSelect =
    "id, user_id, status, check_in_at, check_out_at, check_in_lat, check_in_lng, check_out_lat, check_out_lng, owner:profiles!attendance_sessions_user_id_fkey(full_name, email, designation, role:roles!profiles_role_id_fkey(name, slug))";

  const { data: activeRow, error: activeError } = await supabase
    .from("attendance_sessions")
    .select(sessionSelect)
    .eq("user_id", userId)
    .eq("status", "checked_in")
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) return { ok: false, error: activeError.message };

  let targetSession = activeRow as SessionDetailRow | null;
  if (!targetSession) {
    const { data: recentRow, error: recentError } = await supabase
      .from("attendance_sessions")
      .select(sessionSelect)
      .eq("user_id", userId)
      .order("check_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recentError) return { ok: false, error: recentError.message };
    targetSession = recentRow as SessionDetailRow | null;
  }

  if (!targetSession) return { ok: true, data: null };

  const owner = pickOwner(targetSession.owner);
  const role = pickRole(owner?.role ?? null);

  const pointsResult = await getRecentLocationPingsForSession(
    supabase,
    targetSession.id,
    pointsLimit
  );
  if (!pointsResult.ok) return pointsResult;

  const lastKnownResult = await getLastKnownLocationForUser(supabase, userId);
  if (!lastKnownResult.ok) return lastKnownResult;

  const recentPoints = pointsResult.data.map((p) => ({
    id: p.id,
    captured_at: p.captured_at,
    lat: p.lat,
    lng: p.lng,
    accuracy: p.accuracy,
    source: p.source,
  }));

  const lastKnown = lastKnownResult.data;
  const lastPingAt = lastKnown?.captured_at ?? recentPoints[0]?.captured_at ?? null;
  const timeline = buildTimeline(targetSession, recentPoints, timelineLimit);

  return {
    ok: true,
    data: {
      user_id: userId,
      user_name: owner?.full_name ?? null,
      user_email: owner?.email ?? null,
      role_name: role?.name ?? null,
      role_slug: role?.slug ?? null,
      designation: owner?.designation ?? null,
      tracking_status: resolveTrackingStatus(lastPingAt, staleMinutes),
      session: {
        attendance_session_id: targetSession.id,
        session_status: targetSession.status,
        check_in_at: targetSession.check_in_at,
        check_out_at: targetSession.check_out_at,
        check_in_lat: targetSession.check_in_lat,
        check_in_lng: targetSession.check_in_lng,
        check_out_lat: targetSession.check_out_lat,
        check_out_lng: targetSession.check_out_lng,
      },
      last_ping_at: lastPingAt,
      last_ping_lat: lastKnown?.lat ?? null,
      last_ping_lng: lastKnown?.lng ?? null,
      last_ping_accuracy: lastKnown?.accuracy ?? null,
      recent_points: recentPoints,
      timeline,
    },
  };
}
