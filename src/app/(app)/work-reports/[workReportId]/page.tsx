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
  canReviewWorkReports,
  isOrgAdminRole,
} from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { EditWorkReportForm } from "@/modules/work-reports/components/edit-work-report-form";
import { ReviewWorkReportForm } from "@/modules/work-reports/components/review-work-report-form";
import { SubmitWorkReportButton } from "@/modules/work-reports/components/submit-work-report-button";
import { mapWorkReportRow } from "@/modules/work-reports/normalize";
import type { WorkReportWithPeople } from "@/modules/work-reports/types";

type PageProps = { params: Promise<{ workReportId: string }> };

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

export default async function WorkReportDetailPage({ params }: PageProps) {
  const { workReportId } = await params;
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_reports")
    .select(
      "id, organization_id, owner_user_id, report_date, summary, achievements, challenges, next_step, status, submitted_at, reviewed_by, reviewed_at, review_note, created_at, updated_at, owner:profiles!work_reports_owner_user_id_fkey(full_name, email), reviewer:profiles!work_reports_reviewed_by_fkey(full_name, email)"
    )
    .eq("id", workReportId)
    .maybeSingle();

  if (error || !data) notFound();
  const report: WorkReportWithPeople = mapWorkReportRow(
    data as Parameters<typeof mapWorkReportRow>[0]
  );

  const isOwner = profile?.id === report.owner_user_id;
  const isAdmin = isOrgAdminRole(role);
  const canEditDraft = report.status === "draft" && (isOwner || isAdmin);
  const canSubmitDraft = report.status === "draft" && (isOwner || isAdmin);
  const canReview =
    report.status === "submitted" &&
    !!profile?.id &&
    canReviewWorkReports(role) &&
    profile.id !== report.owner_user_id &&
    (await canReviewerAccessOwner(report.owner_user_id, profile.id, role));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.workReports}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Work Reports
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Work report</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Report summary</CardTitle>
          <CardDescription>Current status and review details.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Report date</dt>
            <dd>{report.report_date}</dd>
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{report.owner_name ?? report.owner_email ?? report.owner_user_id}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-mono text-xs">{report.status}</dd>
            <dt className="text-muted-foreground">Summary</dt>
            <dd>{report.summary}</dd>
            <dt className="text-muted-foreground">Achievements</dt>
            <dd>{report.achievements ?? "—"}</dd>
            <dt className="text-muted-foreground">Challenges</dt>
            <dd>{report.challenges ?? "—"}</dd>
            <dt className="text-muted-foreground">Next step</dt>
            <dd>{report.next_step ?? "—"}</dd>
            <dt className="text-muted-foreground">Submitted at</dt>
            <dd>{report.submitted_at ?? "—"}</dd>
            <dt className="text-muted-foreground">Reviewed by</dt>
            <dd>{report.reviewer_name ?? report.reviewer_email ?? "—"}</dd>
            <dt className="text-muted-foreground">Reviewed at</dt>
            <dd>{report.reviewed_at ?? "—"}</dd>
            <dt className="text-muted-foreground">Review note</dt>
            <dd>{report.review_note ?? "—"}</dd>
          </dl>
        </CardContent>
      </Card>

      {canEditDraft && <EditWorkReportForm workReport={report} />}

      {canSubmitDraft && <SubmitWorkReportButton workReportId={report.id} />}

      {canReview && <ReviewWorkReportForm workReportId={report.id} />}

      {!canEditDraft && !canSubmitDraft && !canReview && (
        <p className="text-sm text-muted-foreground">
          You have read-only access for this work report.
        </p>
      )}
    </div>
  );
}
