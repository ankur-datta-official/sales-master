import { RoleDashboard } from "@/modules/dashboard/components/role-dashboard";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { createClient } from "@/lib/supabase/server";
import { parseCeoDashboardSearchParams } from "@/modules/dashboard/ceo-filters";
import { getDashboardData } from "@/modules/dashboard/service";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const displayName = getUserDisplayName(profile, user);
  const supabase = await createClient();
  const rawSearchParams = await searchParams;
  const ceoFilters = role === "admin" ? parseCeoDashboardSearchParams(rawSearchParams) : undefined;
  const dashboard = await getDashboardData({
    supabase,
    role,
    userId: profile?.id ?? user.id,
    userName: displayName,
    ceoFilters,
  });

  return <RoleDashboard dashboard={dashboard} />;
}
