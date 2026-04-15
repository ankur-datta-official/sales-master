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
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { EditVisitPlanForm } from "@/modules/visit-plans/components/edit-visit-plan-form";
import { UpdateVisitPlanStatusForm } from "@/modules/visit-plans/components/update-visit-plan-status-form";
import { mapVisitPlanRow } from "@/modules/visit-plans/normalize";
import type { VisitPlanWithRelations } from "@/modules/visit-plans/types";

type PageProps = { params: Promise<{ visitPlanId: string }> };

export default async function VisitPlanDetailPage({ params }: PageProps) {
  const { visitPlanId } = await params;
  const { profile } = await requireUserProfile();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visit_plans")
    .select(
      "id, organization_id, party_id, user_id, visit_date, purpose, status, created_by, created_at, updated_at, party:parties!visit_plans_party_id_fkey(name, code), assignee:profiles!visit_plans_user_id_fkey(full_name, email), creator:profiles!visit_plans_created_by_fkey(full_name, email)"
    )
    .eq("id", visitPlanId)
    .maybeSingle();

  if (error || !data) notFound();
  const visit: VisitPlanWithRelations = mapVisitPlanRow(
    data as Parameters<typeof mapVisitPlanRow>[0]
  );

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

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

  const isAssignee = profile?.id === visit.user_id;
  const canEditPlanned = visit.status === "planned" && isAssignee;
  const canUpdateStatus = visit.status === "planned" && isAssignee;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.visitPlans}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Visit Plans
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Visit plan</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Visit details and ownership.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Visit date</dt>
            <dd>{visit.visit_date}</dd>
            <dt className="text-muted-foreground">Party</dt>
            <dd>
              {visit.party_name ?? visit.party_id}
              {visit.party_code ? (
                <span className="text-muted-foreground ml-1 font-mono text-xs">
                  ({visit.party_code})
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Assignee</dt>
            <dd>{visit.assignee_name ?? visit.assignee_email ?? visit.user_id}</dd>
            <dt className="text-muted-foreground">Purpose</dt>
            <dd className="whitespace-pre-wrap">{visit.purpose}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-mono text-xs">{visit.status}</dd>
            <dt className="text-muted-foreground">Created by</dt>
            <dd>{visit.creator_name ?? visit.creator_email ?? visit.created_by}</dd>
            <dt className="text-muted-foreground">Created at</dt>
            <dd>{visit.created_at}</dd>
            <dt className="text-muted-foreground">Updated at</dt>
            <dd>{visit.updated_at}</dd>
          </dl>
        </CardContent>
      </Card>

      {canEditPlanned && <EditVisitPlanForm visitPlan={visit} parties={partiesForEdit} />}

      {canUpdateStatus && <UpdateVisitPlanStatusForm visitPlanId={visit.id} />}

      {!canEditPlanned && !canUpdateStatus && (
        <p className="text-muted-foreground text-sm">
          {isAssignee
            ? "This visit is no longer editable."
            : "You have read-only access for this visit plan."}
        </p>
      )}
    </div>
  );
}
