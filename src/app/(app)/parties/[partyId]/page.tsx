import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
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

  const orgId = profile?.organization_id;
  const formOptions = canEdit && orgId ? await loadPartyFormOptions(supabase, orgId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.parties}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
        >
          ← Parties
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{party.name}</h1>
      </div>

      {canEdit && formOptions ? (
        <UpdatePartyForm party={party} assignees={formOptions.assignees} />
      ) : (
        <PartyReadonlySummary party={party} />
      )}
    </div>
  );
}
