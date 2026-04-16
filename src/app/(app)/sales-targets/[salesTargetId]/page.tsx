import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  DetailHeader,
  DetailPageShell,
  KV,
  KeyValueGrid,
  MetadataCard,
  StatusPill,
} from "@/components/ui/detail-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { canActorViewOrgSubjectScopedRow } from "@/lib/auth/org-scoped-view-access";
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

  const actorProfileId = profile?.id;
  const actorOrganizationId = profile?.organization_id;
  if (!actorProfileId || !actorOrganizationId) {
    redirect(ROUTES.login);
  }
  const canView = await canActorViewOrgSubjectScopedRow(
    supabase,
    actorProfileId,
    actorOrganizationId,
    target.organization_id,
    target.assigned_to_user_id,
    role
  );
  if (!canView) {
    notFound();
  }

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
    <DetailPageShell>
      <DetailHeader
        backHref={ROUTES.salesTargets}
        backLabel="Sales targets"
        title="Sales target"
        description="Assignment and period details."
        badges={
          <>
            <StatusPill tone="neutral">{target.period_type}</StatusPill>
            <StatusPill tone="info">{target.status}</StatusPill>
          </>
        }
      />

      <MetadataCard className="max-w-2xl" title="Summary" description="Assignment and period details.">
        <KeyValueGrid>
          <KV
            label="Assignee"
            value={target.assignee_name ?? target.assignee_email ?? target.assigned_to_user_id}
          />
          <KV
            label="Party"
            value={
              <>
                {target.party_name ?? (target.party_id ? target.party_id : "—")}
                {target.party_code ? (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    ({target.party_code})
                  </span>
                ) : null}
              </>
            }
          />
          <KV label="Start / end" value={`${target.start_date} → ${target.end_date}`} mono />
          <KV label="Target amount" value={target.target_amount} mono />
          <KV label="Target qty" value={target.target_qty != null ? target.target_qty : "—"} mono />
          <KV
            label="Status"
            value={
              <StatusBadge tone="info" size="sm" className="font-mono">
                {target.status}
              </StatusBadge>
            }
          />
          <KV label="Created by" value={target.creator_name ?? target.creator_email ?? target.created_by} />
          <KV label="Created at" value={target.created_at} subtle />
          <KV label="Updated at" value={target.updated_at} subtle />
        </KeyValueGrid>
      </MetadataCard>

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
    </DetailPageShell>
  );
}
