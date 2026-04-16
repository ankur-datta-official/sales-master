import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { DetailHeader, DetailPageShell, StatusPill } from "@/components/ui/detail-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { canActorViewOrgSubjectScopedRow } from "@/lib/auth/org-scoped-view-access";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canMutateParties } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { PartyReadonlySummary } from "@/modules/parties/components/party-readonly-summary";
import { UpdatePartyForm } from "@/modules/parties/components/update-party-form";
import { loadPartyFormOptions } from "@/modules/parties/load-form-options";
import { mapPartyRow } from "@/modules/parties/normalize";
import type { PartyWithAssignee } from "@/modules/parties/types";

type PageProps = { params: Promise<{ partyId: string }> };

export default async function PartyDetailPage({ params }: PageProps) {
  const { partyId } = await params;
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const canEdit = canMutateParties(role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parties")
    .select(
      "id, organization_id, assigned_to_user_id, name, code, contact_person, phone, email, address, notes, status, created_by_user_id, created_at, updated_at, assignee:profiles!parties_assigned_to_user_id_fkey(full_name, email)"
    )
    .eq("id", partyId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const party: PartyWithAssignee = mapPartyRow(
    data as Parameters<typeof mapPartyRow>[0]
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
    party.organization_id,
    party.assigned_to_user_id,
    role
  );
  if (!canView) {
    notFound();
  }

  const orgId = profile?.organization_id;
  const formOptions = canEdit && orgId ? await loadPartyFormOptions(supabase, orgId) : null;

  return (
    <DetailPageShell>
      <DetailHeader
        backHref={ROUTES.parties}
        backLabel="Parties"
        title={party.name}
        description={party.code ? `Code ${party.code}` : "Party details and assignment."}
        badges={
          <StatusPill tone="neutral">
            <span className="capitalize">{party.status ?? "—"}</span>
          </StatusPill>
        }
        actions={
          canEdit ? (
            <Link
              href={ROUTES.parties}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
            >
              All parties
            </Link>
          ) : null
        }
      />

      {canEdit && formOptions ? (
        <UpdatePartyForm party={party} assignees={formOptions.assignees} />
      ) : (
        <PartyReadonlySummary party={party} />
      )}
    </DetailPageShell>
  );
}
