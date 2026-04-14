import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  canReviewWorkPlans,
  isOrgAdminRole,
} from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { EditWorkPlanForm } from "@/modules/work-plans/components/edit-work-plan-form";
import { ReviewWorkPlanForm } from "@/modules/work-plans/components/review-work-plan-form";
import { SubmitWorkPlanButton } from "@/modules/work-plans/components/submit-work-plan-button";
import { mapWorkPlanRow } from "@/modules/work-plans/normalize";
import type { WorkPlanWithPeople } from "@/modules/work-plans/types";

type PageProps = { params: Promise<{ workPlanId: string }> };

async function canReviewerAccessOwner(
  ownerId: string,
  actorId: string,
  role: string | null
) {
  if (role === "hos" || role === "admin") return true;
  if (role !== "manager" && role !== "assistant_manager") return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("can_access_profile", {
    p_actor_profile_id: actorId,
    p_target_profile_id: ownerId,
    p_has_org_wide_access: false,
    p_max_depth: 25,
  });
  if (error) return false;
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row && typeof row === "object" && "can_access" in row && row.can_access);
}

export default async function WorkPlanDetailPage({ params }: PageProps) {
  const { workPlanId } = await params;
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_plans")
    .select(
      "id, organization_id, owner_user_id, plan_date, title, details, priority, status, submitted_at, reviewed_by, reviewed_at, review_note, created_at, updated_at, owner:profiles!work_plans_owner_user_id_fkey(full_name, email), reviewer:profiles!work_plans_reviewed_by_fkey(full_name, email)"
    )
    .eq("id", workPlanId)
    .maybeSingle();

  if (error || !data) notFound();
  const plan: WorkPlanWithPeople = mapWorkPlanRow(
    data as Parameters<typeof mapWorkPlanRow>[0]
  );

  const isOwner = profile?.id === plan.owner_user_id;
  const isAdmin = isOrgAdminRole(role);
  const canEditDraft = plan.status === "draft" && (isOwner || isAdmin);
  const canSubmitDraft = plan.status === "draft" && (isOwner || isAdmin);
  const canReview =
    plan.status === "submitted" &&
    !!profile?.id &&
    canReviewWorkPlans(role) &&
    profile.id !== plan.owner_user_id &&
    (await canReviewerAccessOwner(plan.owner_user_id, profile.id, role));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.workPlans}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Work Plans
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{plan.title}</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Plan summary</CardTitle>
          <CardDescription>Current status and review details.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Plan date</dt>
            <dd>{plan.plan_date}</dd>
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{plan.owner_name ?? plan.owner_email ?? plan.owner_user_id}</dd>
            <dt className="text-muted-foreground">Priority</dt>
            <dd>{plan.priority ?? "—"}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-mono text-xs">{plan.status}</dd>
            <dt className="text-muted-foreground">Submitted at</dt>
            <dd>{plan.submitted_at ?? "—"}</dd>
            <dt className="text-muted-foreground">Reviewed by</dt>
            <dd>{plan.reviewer_name ?? plan.reviewer_email ?? "—"}</dd>
            <dt className="text-muted-foreground">Reviewed at</dt>
            <dd>{plan.reviewed_at ?? "—"}</dd>
            <dt className="text-muted-foreground">Review note</dt>
            <dd>{plan.review_note ?? "—"}</dd>
          </dl>
        </CardContent>
      </Card>

      {canEditDraft && <EditWorkPlanForm workPlan={plan} />}

      {canSubmitDraft && <SubmitWorkPlanButton workPlanId={plan.id} />}

      {canReview && <ReviewWorkPlanForm workPlanId={plan.id} />}

      {!canEditDraft && !canSubmitDraft && !canReview && (
        <p className="text-sm text-muted-foreground">
          You have read-only access for this work plan.
        </p>
      )}
    </div>
  );
}
