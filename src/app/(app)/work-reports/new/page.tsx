import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { canCreateWorkReports } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreateWorkReportForm } from "@/modules/work-reports/components/create-work-report-form";

export default async function NewWorkReportPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateWorkReports(role)) {
    redirect(ROUTES.workReports);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New work report</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.workReports}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Back to work reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New work report</h1>
        <p className="text-muted-foreground text-sm">
          Create your daily report in draft and submit for review.
        </p>
      </div>
      <CreateWorkReportForm organizationId={orgId} />
    </div>
  );
}
