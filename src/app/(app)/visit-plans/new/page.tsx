import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateVisitPlans, isOrgAdminRole } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreateVisitPlanForm } from "@/modules/visit-plans/components/create-visit-plan-form";

export default async function NewVisitPlanPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateVisitPlans(role)) {
    redirect(ROUTES.visitPlans);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New visit plan</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.visitPlans}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Back to visit plans
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const isAdmin = isOrgAdminRole(role);

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: assignableProfiles } = isAdmin
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("organization_id", orgId)
        .order("full_name", { ascending: true })
    : { data: null };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New visit plan</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "Create a visit for any user in your organization."
            : "Schedule a planned visit assigned to you."}
        </p>
      </div>
      <CreateVisitPlanForm
        organizationId={orgId}
        isAdmin={isAdmin}
        parties={parties ?? []}
        assignableProfiles={assignableProfiles ?? []}
      />
    </div>
  );
}
