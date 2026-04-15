"use server";

import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCheckInOutOwnAttendance } from "@/lib/users/actor-permissions";
import {
  createLocationPingSchema,
  type CreateLocationPingInput,
} from "@/modules/location-pings/schemas";
import { recordLocationPing } from "@/modules/location-pings/service";
import type { LocationPing } from "@/modules/location-pings/types";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createLocationPingAction(
  input: CreateLocationPingInput
): Promise<ActionResult<LocationPing>> {
  const parsed = createLocationPingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const session = await requireUserProfile();
  const role = resolveAppRole(session.user, session.profile);
  if (!canCheckInOutOwnAttendance(role)) {
    return { ok: false, error: "You do not have permission to send location pings." };
  }

  const result = await recordLocationPing(supabase, session, parsed.data);
  if (!result.ok) return result;
  return { ok: true, data: result.data };
}
