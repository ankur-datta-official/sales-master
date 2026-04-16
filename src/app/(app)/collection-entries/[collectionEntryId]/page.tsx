import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
import { canActorViewOrgSubjectScopedRow } from "@/lib/auth/org-scoped-view-access";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  canVerifyCollectionEntries,
  isOrgAdminRole,
} from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { EditCollectionEntryForm } from "@/modules/collection-entries/components/edit-collection-entry-form";
import { VerifyCollectionEntryPanel } from "@/modules/collection-entries/components/verify-collection-entry-panel";
import { mapCollectionEntryRow } from "@/modules/collection-entries/normalize";
import { isCollectionEntryOwnerEditableWindow } from "@/modules/collection-entries/schemas";
import type { CollectionEntryWithRelations } from "@/modules/collection-entries/types";

type PageProps = { params: Promise<{ collectionEntryId: string }> };

export default async function CollectionEntryDetailPage({ params }: PageProps) {
  const { collectionEntryId } = await params;
  const { user, profile } = await requireUserProfile();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collection_entries")
    .select(
      "id, organization_id, user_id, party_id, entry_date, amount, remarks, verification_status, created_by, created_at, updated_at, party:parties!collection_entries_party_id_fkey(name, code), collector:profiles!collection_entries_user_id_fkey(full_name, email), creator:profiles!collection_entries_created_by_fkey(full_name, email)"
    )
    .eq("id", collectionEntryId)
    .maybeSingle();

  if (error || !data) notFound();

  const entry: CollectionEntryWithRelations = mapCollectionEntryRow(
    data as Parameters<typeof mapCollectionEntryRow>[0]
  );

  const actorProfileId = profile?.id;
  const actorOrganizationId = profile?.organization_id;
  if (!actorProfileId || !actorOrganizationId) {
    redirect(ROUTES.login);
  }
  const role = resolveAppRole(user, profile);
  const canView = await canActorViewOrgSubjectScopedRow(
    supabase,
    actorProfileId,
    actorOrganizationId,
    entry.organization_id,
    entry.user_id,
    role,
    { accountsOrgWide: true }
  );
  if (!canView) {
    notFound();
  }

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const isAdmin = isOrgAdminRole(role);
  const canVerify = canVerifyCollectionEntries(role);

  const canOwnerEditUnverified =
    entry.verification_status === "unverified" &&
    profile?.id != null &&
    isCollectionEntryOwnerEditableWindow(entry.created_at, entry.user_id, profile.id);

  const canEdit = isAdmin || canOwnerEditUnverified;

  const showVerifyPanel =
    canVerify && entry.verification_status === "unverified";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.collectionEntries}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Collection entries
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Collection entry</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Collection record and verification state.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Verification</dt>
            <dd className="font-medium capitalize">{entry.verification_status}</dd>
            <dt className="text-muted-foreground">Collector</dt>
            <dd>{entry.collector_name ?? entry.collector_email ?? entry.user_id}</dd>
            <dt className="text-muted-foreground">Party</dt>
            <dd>
              {entry.party_name ?? entry.party_id}
              {entry.party_code ? (
                <span className="text-muted-foreground ml-1 font-mono text-xs">
                  ({entry.party_code})
                </span>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Entry date</dt>
            <dd className="font-mono text-xs">{entry.entry_date}</dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-mono text-xs">{entry.amount}</dd>
            <dt className="text-muted-foreground">Remarks</dt>
            <dd className="whitespace-pre-wrap">{entry.remarks || "—"}</dd>
            <dt className="text-muted-foreground">Created by</dt>
            <dd>{entry.creator_name ?? entry.creator_email ?? entry.created_by}</dd>
            <dt className="text-muted-foreground">Created at</dt>
            <dd>{entry.created_at}</dd>
            <dt className="text-muted-foreground">Updated at</dt>
            <dd>{entry.updated_at}</dd>
          </dl>
        </CardContent>
      </Card>

      {showVerifyPanel && <VerifyCollectionEntryPanel collectionEntryId={entry.id} />}

      {canEdit && <EditCollectionEntryForm collectionEntry={entry} parties={parties ?? []} />}

      {!canEdit && (
        <p className="text-muted-foreground text-sm">
          {entry.verification_status !== "unverified"
            ? "This entry is no longer editable as an owner (verified or rejected)."
            : profile?.id === entry.user_id
              ? "This entry is older than 72 hours and can no longer be edited."
              : "You have read-only access for this collection entry."}
        </p>
      )}
    </div>
  );
}
