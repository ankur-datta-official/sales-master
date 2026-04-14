import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { CreateUserForm } from "@/modules/users/components/create-user-form";
import { loadUserFormOptions } from "@/modules/users/load-form-options";
import { canMutateOrgUsers } from "@/lib/users/actor-permissions";

export default async function NewUserPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canMutateOrgUsers(role)) {
    redirect(ROUTES.users);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New user</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned before you can invite users.
        </p>
        <Link href={ROUTES.users} className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 items-center justify-center px-4")}>
          Back to users
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { roles, branches, managers } = await loadUserFormOptions(supabase, orgId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New user</h1>
        <p className="text-muted-foreground text-sm">
          Provisions Supabase Auth and completes the profile for your organization.
        </p>
      </div>
      <CreateUserForm
        organizationId={orgId}
        roles={roles}
        branches={branches}
        managers={managers}
      />
    </div>
  );
}
