import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canManageCollectionTargets } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { loadAssignableProfilesForCollectionTargets } from "@/modules/collection-targets/assignable-profiles";
import { CreateCollectionTargetForm } from "@/modules/collection-targets/components/create-collection-target-form";

export default async function NewCollectionTargetPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canManageCollectionTargets(role)) {
    redirect(ROUTES.collectionTargets);
  }

  const orgId = profile?.organization_id;
  if (!orgId || !profile?.id) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New collection target</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.collectionTargets}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Back to collection targets
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { profiles: assignableProfiles, error: assignErr } =
    await loadAssignableProfilesForCollectionTargets(orgId, profile.id, role);

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New collection target</h1>
        <p className="text-muted-foreground text-sm">
          Managers assign within their tree; HOS and admin can assign across the organization.
        </p>
      </div>
      {assignErr ? (
        <p className="text-destructive text-sm">Could not load assignable users: {assignErr}</p>
      ) : null}
      <CreateCollectionTargetForm
        organizationId={orgId}
        assignableProfiles={assignableProfiles}
        parties={parties ?? []}
      />
    </div>
  );
}
