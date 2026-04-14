import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { normalizeProfileRow, PROFILE_WITH_ROLE_SELECT } from "@/lib/profiles/fetch-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { UpdateUserForm } from "@/modules/users/components/update-user-form";
import { UserReadonlySummary } from "@/modules/users/components/user-readonly-summary";
import { loadUserFormOptions } from "@/modules/users/load-form-options";
import { canMutateOrgUsers } from "@/lib/users/actor-permissions";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const { user, profile: actorProfile } = await requireUserProfile();
  const actorRole = resolveAppRole(user, actorProfile);
  const canEdit = canMutateOrgUsers(actorRole);

  const supabase = await createClient();
  const { data: raw, error } = await supabase
    .from("profiles")
    .select(PROFILE_WITH_ROLE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error || !raw) {
    notFound();
  }

  const profile = normalizeProfileRow(raw);
  if (!profile) {
    notFound();
  }

  let managerLabel: string | null = null;
  if (profile.reports_to_user_id) {
    const { data: mgr } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", profile.reports_to_user_id)
      .maybeSingle();
    managerLabel = mgr?.full_name ?? mgr?.email ?? null;
  }

  const orgId = actorProfile?.organization_id;
  const formOptions =
    canEdit && orgId
      ? await loadUserFormOptions(supabase, orgId)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.users}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Users
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.full_name ?? profile.email ?? "User"}
        </h1>
      </div>

      {canEdit && formOptions ? (
        <UpdateUserForm
          profile={profile}
          roles={formOptions.roles}
          branches={formOptions.branches}
          managers={formOptions.managers}
        />
      ) : (
        <UserReadonlySummary profile={profile} managerLabel={managerLabel} />
      )}
    </div>
  );
}
