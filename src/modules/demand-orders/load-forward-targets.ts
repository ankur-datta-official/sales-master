import type { SupabaseClient } from "@supabase/supabase-js";

const REVIEWER_SLUGS = new Set(["manager", "assistant_manager", "hos", "admin"]);

export async function loadDemandOrderForwardTargets(
  supabase: SupabaseClient,
  organizationId: string,
  excludeIds: string[]
): Promise<{ id: string; full_name: string | null; email: string | null }[]> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role_id")
    .eq("organization_id", organizationId);

  const roleIds = [...new Set((profiles ?? []).map((p) => p.role_id).filter(Boolean))];
  if (!roleIds.length) return [];

  const { data: roles } = await supabase.from("roles").select("id, slug").in("id", roleIds);
  const slugById = new Map((roles ?? []).map((r) => [r.id, r.slug]));

  return (profiles ?? [])
    .filter(
      (p) =>
        !excludeIds.includes(p.id) &&
        p.role_id != null &&
        REVIEWER_SLUGS.has(String(slugById.get(p.role_id) ?? ""))
    )
    .map((p) => ({ id: p.id, full_name: p.full_name, email: p.email }))
    .sort((a, b) => (a.full_name ?? a.email ?? "").localeCompare(b.full_name ?? b.email ?? ""));
}
