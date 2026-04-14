import type { SupabaseClient } from "@supabase/supabase-js";

export type RoleOption = { id: string; name: string; slug: string; level: number };
export type BranchOption = { id: string; name: string; code: string };
export type ManagerOption = { id: string; full_name: string | null; email: string | null };

export async function loadUserFormOptions(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{
  roles: RoleOption[];
  branches: BranchOption[];
  managers: ManagerOption[];
}> {
  const orgFilter = `organization_id.is.null,organization_id.eq.${organizationId}`;

  const [rolesRes, branchesRes, managersRes] = await Promise.all([
    supabase
      .from("roles")
      .select("id, name, slug, level")
      .eq("status", "active")
      .or(orgFilter)
      .order("level", { ascending: false }),
    supabase
      .from("branches")
      .select("id, name, code")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("organization_id", organizationId)
      .order("full_name", { ascending: true }),
  ]);

  return {
    roles: (rolesRes.data ?? []) as RoleOption[],
    branches: (branchesRes.data ?? []) as BranchOption[],
    managers: (managersRes.data ?? []) as ManagerOption[],
  };
}
