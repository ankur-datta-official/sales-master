import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import {
  normalizeProfileRow,
  PROFILE_WITH_ROLE_SELECT,
} from "@/lib/profiles/fetch-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { SendSetupLinkButton } from "@/modules/users/components/send-setup-link-button";
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
  const actorProfileId = actorProfile?.id;

  if (!actorProfileId) {
    redirect(ROUTES.login);
  }

  const supabase = await createClient();
  if (!canEdit) {
    const canSee = await rpcCanAccessProfile(
      supabase,
      actorProfileId,
      userId,
      actorRole
    );

    if (!canSee) {
      notFound();
    }
  }

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
    const { data: manager } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", profile.reports_to_user_id)
      .maybeSingle();

    managerLabel = manager?.full_name ?? manager?.email ?? null;
  }

  const organizationId = actorProfile?.organization_id;
  const formOptions =
    canEdit && organizationId
      ? await loadUserFormOptions(supabase, organizationId)
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
          Back to users
        </Link>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile.full_name ?? profile.email ?? "User"}
          </h1>
          {canEdit && profile.email ? (
            <SendSetupLinkButton userId={profile.id} />
          ) : null}
        </div>
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
