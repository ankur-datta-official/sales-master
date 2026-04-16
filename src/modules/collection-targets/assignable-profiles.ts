import type { AppRole } from "@/constants/roles";
import {
  loadAssignableProfilesByHierarchy,
  type AssignableProfileRow,
} from "@/lib/auth/target-assignment";
import { createClient } from "@/lib/supabase/server";

export async function loadAssignableProfilesForCollectionTargets(
  organizationId: string,
  actorProfileId: string,
  role: AppRole | null
): Promise<{ profiles: AssignableProfileRow[]; error: string | null }> {
  const supabase = await createClient();
  return loadAssignableProfilesByHierarchy({
    supabase,
    organizationId,
    actorProfileId,
    role,
    contextPrefix: "collectionTargets.assignableProfiles",
  });
}
