"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canCheckInOutOwnAttendance } from "@/lib/users/actor-permissions";
import {
  checkInAttendanceSchema,
  checkOutAttendanceSchema,
  type CheckInAttendanceInput,
  type CheckOutAttendanceInput,
} from "@/modules/attendance/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

function clipDeviceInfo(s: string | undefined, max = 2000): string {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max);
}

export async function checkInAttendanceAction(
  input: CheckInAttendanceInput
): Promise<ActionResult<{ sessionId: string }>> {
  const parsed = checkInAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCheckInOutOwnAttendance(role)) {
    return { ok: false, error: "You do not have permission to check in." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const addr = (parsed.data.check_in_address ?? "").trim();
  const deviceInfo = clipDeviceInfo(parsed.data.device_info);

  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      organization_id: profile.organization_id,
      user_id: profile.id,
      check_in_lat: parsed.data.check_in_lat ?? null,
      check_in_lng: parsed.data.check_in_lng ?? null,
      check_in_address: addr.length ? addr : null,
      device_info: deviceInfo,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        ok: false,
        error: "You already have an active check-in. Check out before checking in again.",
      };
    }
    return {
      ok: false,
      error: toSafeActionError(error, "Could not check in.", "attendance.checkInAttendanceAction"),
    };
  }

  revalidatePath(ROUTES.attendance);
  revalidatePath(ROUTES.attendanceHistory);
  revalidatePath(`${ROUTES.attendance}/${data.id}`);
  return { ok: true, data: { sessionId: data.id } };
}

export async function checkOutAttendanceAction(
  input: CheckOutAttendanceInput
): Promise<ActionResult> {
  const parsed = checkOutAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCheckInOutOwnAttendance(role)) {
    return { ok: false, error: "You do not have permission to check out." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: active, error: activeErr } = await supabase
    .from("attendance_sessions")
    .select("id")
    .eq("user_id", profile.id)
    .eq("status", "checked_in")
    .maybeSingle();

  if (activeErr) {
    return {
      ok: false,
      error: toSafeActionError(
        activeErr,
        "Could not verify active attendance session.",
        "attendance.checkOutAttendanceAction.fetchActive"
      ),
    };
  }
  if (!active) {
    return { ok: false, error: "No active check-in to close." };
  }

  const outAddr = (parsed.data.check_out_address ?? "").trim();

  const { error } = await supabase
    .from("attendance_sessions")
    .update({
      check_out_at: new Date().toISOString(),
      check_out_lat: parsed.data.check_out_lat ?? null,
      check_out_lng: parsed.data.check_out_lng ?? null,
      check_out_address: outAddr.length ? outAddr : null,
      status: "checked_out",
    })
    .eq("id", active.id)
    .eq("user_id", profile.id)
    .eq("status", "checked_in");

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not check out.", "attendance.checkOutAttendanceAction"),
    };
  }

  revalidatePath(ROUTES.attendance);
  revalidatePath(ROUTES.attendanceHistory);
  revalidatePath(`${ROUTES.attendance}/${active.id}`);
  return { ok: true };
}
