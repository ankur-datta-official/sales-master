import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { canCreateWorkPlans } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreateWorkPlanForm } from "@/modules/work-plans/components/create-work-plan-form";

export default async function NewWorkPlanPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateWorkPlans(role)) {
    redirect(ROUTES.workPlans);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New work plan</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.workPlans}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Back to work plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New work plan</h1>
        <p className="text-muted-foreground text-sm">
          Create your daily plan in draft and submit for review.
        </p>
      </div>
      <CreateWorkPlanForm organizationId={orgId} />
    </div>
  );
}
