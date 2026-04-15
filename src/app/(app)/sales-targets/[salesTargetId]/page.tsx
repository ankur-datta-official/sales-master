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
import { canManageSalesTargets } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { loadAssignableProfilesForSalesTargets } from "@/modules/sales-targets/assignable-profiles";
import { EditSalesTargetForm } from "@/modules/sales-targets/components/edit-sales-target-form";
import { mapSalesTargetRow } from "@/modules/sales-targets/normalize";
import type { SalesTargetWithRelations } from "@/modules/sales-targets/types";

type PageProps = { params: Promise<{ salesTargetId: string }> };

export default async function SalesTargetDetailPage({ params }: PageProps) {
  const { salesTargetId } = await params;
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_targets")
    .select(
      "id, organization_id, assigned_to_user_id, party_id, period_type, start_date, end_date, target_amount, target_qty, status, created_by, created_at, updated_at, party:parties!sales_targets_party_id_fkey(name, code), assignee:profiles!sales_targets_assigned_to_user_id_fkey(full_name, email), creator:profiles!sales_targets_created_by_fkey(full_name, email)"
    )
    .eq("id", salesTargetId)
    .maybeSingle();

  if (error || !data) notFound();

  const target: SalesTargetWithRelations = mapSalesTargetRow(
    data as Parameters<typeof mapSalesTargetRow>[0]
  );

  const orgId = profile?.organization_id;
  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const { profiles: assignableProfiles, error: assignErr } =
    orgId && profile?.id
      ? await loadAssignableProfilesForSalesTargets(orgId, profile.id, role)
      : { profiles: [], error: null };

  const canEdit = canManageSalesTargets(role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.salesTargets}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Sales targets
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Sales target</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Assignment and period details.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Assignee</dt>
            <dd>
              {target.assignee_name ?? target.assignee_email ?? target.assigned_to_user_id}
            </dd>
            <dt className="text-muted-foreground">Party</dt>
            <dd>
              {target.party_name ?? (target.party_id ? target.party_id : "—")}
              {target.party_code ? (
                <span className="text-muted-foreground ml-1 font-mono text-xs">
                  ({target.party_code})
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Period</dt>
            <dd className="font-mono text-xs">{target.period_type}</dd>
            <dt className="text-muted-foreground">Start / end</dt>
            <dd className="font-mono text-xs">
              {target.start_date} → {target.end_date}
            </dd>
            <dt className="text-muted-foreground">Target amount</dt>
            <dd className="font-mono text-xs">{target.target_amount}</dd>
            <dt className="text-muted-foreground">Target qty</dt>
            <dd className="font-mono text-xs">
              {target.target_qty != null ? target.target_qty : "—"}
            </dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-mono text-xs">{target.status}</dd>
            <dt className="text-muted-foreground">Created by</dt>
            <dd>{target.creator_name ?? target.creator_email ?? target.created_by}</dd>
            <dt className="text-muted-foreground">Created at</dt>
            <dd>{target.created_at}</dd>
            <dt className="text-muted-foreground">Updated at</dt>
            <dd>{target.updated_at}</dd>
          </dl>
        </CardContent>
      </Card>

      {canEdit && assignErr ? (
        <p className="text-destructive text-sm">Could not load assignable users: {assignErr}</p>
      ) : null}

      {canEdit && !assignErr ? (
        <EditSalesTargetForm
          salesTarget={target}
          assignableProfiles={assignableProfiles}
          parties={parties ?? []}
        />
      ) : null}

      {!canEdit && (
        <p className="text-muted-foreground text-sm">
          You can view this target but only managers, HOS, and admins can edit assignments.
        </p>
      )}
    </div>
  );
}
