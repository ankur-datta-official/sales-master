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
import { isOrgAdminRole } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { EditVisitLogForm } from "@/modules/visit-logs/components/edit-visit-log-form";
import { mapVisitLogRow } from "@/modules/visit-logs/normalize";
import { isVisitLogOwnerEditableWindow } from "@/modules/visit-logs/schemas";
import type { VisitLogWithRelations, VisitPlanLinkOption } from "@/modules/visit-logs/types";

type PageProps = { params: Promise<{ visitLogId: string }> };

export default async function VisitLogDetailPage({ params }: PageProps) {
  const { visitLogId } = await params;
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const isAdmin = isOrgAdminRole(role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visit_logs")
    .select(
      "id, organization_id, party_id, user_id, visit_plan_id, check_in_time, check_out_time, check_in_lat, check_in_lng, check_out_lat, check_out_lng, notes, outcome, status, created_at, updated_at, party:parties!visit_logs_party_id_fkey(name, code), assignee:profiles!visit_logs_user_id_fkey(full_name, email), visit_plan:visit_plans!visit_logs_visit_plan_id_fkey(visit_date, purpose)"
    )
    .eq("id", visitLogId)
    .maybeSingle();

  if (error || !data) notFound();
  const visit: VisitLogWithRelations = mapVisitLogRow(
    data as Parameters<typeof mapVisitLogRow>[0]
  );

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: planRows } = await supabase
    .from("visit_plans")
    .select("id, party_id, user_id, visit_date, purpose")
    .order("visit_date", { ascending: false })
    .limit(300);

  let linkableVisitPlans: VisitPlanLinkOption[] = (planRows ?? []).map((r) => ({
    id: r.id,
    party_id: r.party_id,
    user_id: r.user_id,
    visit_date: r.visit_date,
    purpose: r.purpose,
  }));

  if (
    visit.visit_plan_id &&
    !linkableVisitPlans.some((p) => p.id === visit.visit_plan_id) &&
    profile?.organization_id
  ) {
    const { data: orphanPlan } = await supabase
      .from("visit_plans")
      .select("id, party_id, user_id, visit_date, purpose")
      .eq("id", visit.visit_plan_id)
      .maybeSingle();
    if (orphanPlan) {
      linkableVisitPlans = [
        {
          id: orphanPlan.id,
          party_id: orphanPlan.party_id,
          user_id: orphanPlan.user_id,
          visit_date: orphanPlan.visit_date,
          purpose: orphanPlan.purpose,
        },
        ...linkableVisitPlans,
      ];
    }
  }

  const partyRows = parties ?? [];
  const partiesForEdit = partyRows.some((p) => p.id === visit.party_id)
    ? partyRows
    : [
        {
          id: visit.party_id,
          name: visit.party_name ?? visit.party_id,
        },
        ...partyRows,
      ];

  const isVisitor = profile?.id === visit.user_id;
  const canEdit =
    isAdmin || (profile?.id && isVisitLogOwnerEditableWindow(visit.created_at, visit.user_id, profile.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.visitLogs}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Visit logs
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Visit log</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Visit record and optional plan link.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Party</dt>
            <dd>
              {visit.party_name ?? visit.party_id}
              {visit.party_code ? (
                <span className="text-muted-foreground ml-1 font-mono text-xs">
                  ({visit.party_code})
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Visitor</dt>
            <dd>{visit.assignee_name ?? visit.assignee_email ?? visit.user_id}</dd>
            <dt className="text-muted-foreground">Visit plan</dt>
            <dd>
              {visit.visit_plan_id ? (
                <>
                  <span className="font-mono text-xs">{visit.visit_plan_id}</span>
                  {visit.visit_plan_visit_date ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({visit.visit_plan_visit_date})
                    </span>
                  ) : null}
                  {visit.visit_plan_purpose ? (
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                      {visit.visit_plan_purpose}
                    </p>
                  ) : null}
                  <div className="mt-1">
                    <Link
                      href={`${ROUTES.visitPlans}/${visit.visit_plan_id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Open visit plan
                    </Link>
                  </div>
                </>
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-muted-foreground">Check-in</dt>
            <dd>{visit.check_in_time ?? "—"}</dd>
            <dt className="text-muted-foreground">Check-out</dt>
            <dd>{visit.check_out_time ?? "—"}</dd>
            <dt className="text-muted-foreground">Check-in GPS</dt>
            <dd>
              {visit.check_in_lat != null && visit.check_in_lng != null
                ? `${visit.check_in_lat}, ${visit.check_in_lng}`
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Check-out GPS</dt>
            <dd>
              {visit.check_out_lat != null && visit.check_out_lng != null
                ? `${visit.check_out_lat}, ${visit.check_out_lng}`
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Outcome</dt>
            <dd className="whitespace-pre-wrap">{visit.outcome || "—"}</dd>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="whitespace-pre-wrap">{visit.notes || "—"}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-mono text-xs">{visit.status}</dd>
            <dt className="text-muted-foreground">Created at</dt>
            <dd>{visit.created_at}</dd>
            <dt className="text-muted-foreground">Updated at</dt>
            <dd>{visit.updated_at}</dd>
          </dl>
        </CardContent>
      </Card>

      {canEdit && (
        <EditVisitLogForm
          visitLog={visit}
          parties={partiesForEdit}
          linkableVisitPlans={linkableVisitPlans}
        />
      )}

      {!canEdit && (
        <p className="text-muted-foreground text-sm">
          {isVisitor
            ? "This log is older than 72 hours and can no longer be edited."
            : "You have read-only access for this visit log."}
        </p>
      )}
    </div>
  );
}
