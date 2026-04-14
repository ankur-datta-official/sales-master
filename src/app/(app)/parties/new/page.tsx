import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canMutateParties } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreatePartyForm } from "@/modules/parties/components/create-party-form";
import { loadPartyFormOptions } from "@/modules/parties/load-form-options";

export default async function NewPartyPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canMutateParties(role)) {
    redirect(ROUTES.parties);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New party</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.parties}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 items-center justify-center px-4")}
        >
          Back to parties
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { assignees } = await loadPartyFormOptions(supabase, orgId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New party</h1>
        <p className="text-muted-foreground text-sm">
          Create party and assign it to a responsible user.
        </p>
      </div>
      <CreatePartyForm organizationId={orgId} assignees={assignees} />
    </div>
  );
}
