import type { SupabaseClient } from "@supabase/supabase-js";

export type PartyAssigneeOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function loadPartyFormOptions(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ assignees: PartyAssigneeOption[] }> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("organization_id", organizationId)
    .order("full_name", { ascending: true });

  return {
    assignees: (data ?? []) as PartyAssigneeOption[],
  };
}
