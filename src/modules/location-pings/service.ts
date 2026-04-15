import type { SupabaseClient } from "@supabase/supabase-js";

import { mapLocationPingRow } from "@/modules/location-pings/normalize";
import type { CreateLocationPingInput } from "@/modules/location-pings/schemas";
import type { LocationPing } from "@/modules/location-pings/types";
import type { AuthenticatedSession } from "@/lib/auth/get-current-profile";

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

const LOCATION_PING_ROW_SELECT =
  "id, organization_id, attendance_session_id, user_id, captured_at, lat, lng, accuracy, speed, source, created_at";

export async function recordLocationPing(
  supabase: SupabaseClient,
  session: AuthenticatedSession,
  input: CreateLocationPingInput
): Promise<ServiceResult<LocationPing>> {
  if (!session.profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: attendance } = await supabase
    .from("attendance_sessions")
    .select("id, organization_id, user_id, status, check_out_at")
    .eq("id", input.attendance_session_id)
    .maybeSingle();

  if (!attendance || attendance.organization_id !== session.profile.organization_id) {
    return { ok: false, error: "Attendance session not found in your organization." };
  }
  if (attendance.user_id !== session.profile.id) {
    return { ok: false, error: "You can only send location pings for your own active session." };
  }
  if (attendance.status !== "checked_in" || attendance.check_out_at != null) {
    return { ok: false, error: "Session is already checked out and cannot accept new pings." };
  }

  const { data, error } = await supabase
    .from("location_pings")
    .insert({
      organization_id: session.profile.organization_id,
      attendance_session_id: input.attendance_session_id,
      user_id: session.profile.id,
      captured_at: input.captured_at ?? new Date().toISOString(),
      lat: input.lat,
      lng: input.lng,
      accuracy: input.accuracy ?? null,
      speed: input.speed ?? null,
      source: input.source,
    })
    .select(LOCATION_PING_ROW_SELECT)
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not save location ping." };
  }

  return {
    ok: true,
    data: mapLocationPingRow(data as Parameters<typeof mapLocationPingRow>[0]),
  };
}

export async function getRecentLocationPingsForSession(
  supabase: SupabaseClient,
  attendanceSessionId: string,
  limit = 50
): Promise<ServiceResult<LocationPing[]>> {
  const { data, error } = await supabase
    .from("location_pings")
    .select(LOCATION_PING_ROW_SELECT)
    .eq("attendance_session_id", attendanceSessionId)
    .order("captured_at", { ascending: false })
    .limit(limit);

  if (error) return { ok: false, error: "Could not load session location history." };
  return {
    ok: true,
    data: (data ?? []).map((row) => mapLocationPingRow(row as Parameters<typeof mapLocationPingRow>[0])),
  };
}

export async function getLastKnownLocationForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ServiceResult<LocationPing | null>> {
  const { data, error } = await supabase
    .from("location_pings")
    .select(LOCATION_PING_ROW_SELECT)
    .eq("user_id", userId)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: "Could not load last known location." };
  if (!data) return { ok: true, data: null };
  return { ok: true, data: mapLocationPingRow(data as Parameters<typeof mapLocationPingRow>[0]) };
}
