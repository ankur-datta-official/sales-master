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
import { isOrgAdminRole } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { EditSalesEntryForm } from "@/modules/sales-entries/components/edit-sales-entry-form";
import { mapSalesEntryRow } from "@/modules/sales-entries/normalize";
import { isSalesEntryOwnerEditableWindow } from "@/modules/sales-entries/schemas";
import type { SalesEntryWithRelations } from "@/modules/sales-entries/types";

type PageProps = { params: Promise<{ salesEntryId: string }> };

export default async function SalesEntryDetailPage({ params }: PageProps) {
  const { salesEntryId } = await params;
  const { user, profile } = await requireUserProfile();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_entries")
    .select(
      "id, organization_id, user_id, party_id, entry_date, amount, quantity, remarks, source, created_by, created_at, updated_at, party:parties!sales_entries_party_id_fkey(name, code), seller:profiles!sales_entries_user_id_fkey(full_name, email), creator:profiles!sales_entries_created_by_fkey(full_name, email)"
    )
    .eq("id", salesEntryId)
    .maybeSingle();

  if (error || !data) notFound();

  const entry: SalesEntryWithRelations = mapSalesEntryRow(
    data as Parameters<typeof mapSalesEntryRow>[0]
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
    role
  );
  if (!canView) {
    notFound();
  }

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const isAdmin = isOrgAdminRole(role);

  const canEdit =
    isAdmin ||
    (profile?.id != null &&
      isSalesEntryOwnerEditableWindow(entry.created_at, entry.user_id, profile.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.salesEntries}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          ← Sales entries
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Sales entry</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Manual sale record.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Seller</dt>
            <dd>{entry.seller_name ?? entry.seller_email ?? entry.user_id}</dd>
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
            <dt className="text-muted-foreground">Quantity</dt>
            <dd className="font-mono text-xs">{entry.quantity}</dd>
            <dt className="text-muted-foreground">Remarks</dt>
            <dd className="whitespace-pre-wrap">{entry.remarks || "—"}</dd>
            <dt className="text-muted-foreground">Source</dt>
            <dd className="font-mono text-xs">{entry.source}</dd>
            <dt className="text-muted-foreground">Created by</dt>
            <dd>{entry.creator_name ?? entry.creator_email ?? entry.created_by}</dd>
            <dt className="text-muted-foreground">Created at</dt>
            <dd>{entry.created_at}</dd>
            <dt className="text-muted-foreground">Updated at</dt>
            <dd>{entry.updated_at}</dd>
          </dl>
        </CardContent>
      </Card>

      {canEdit && <EditSalesEntryForm salesEntry={entry} parties={parties ?? []} />}

      {!canEdit && (
        <p className="text-muted-foreground text-sm">
          {profile?.id === entry.user_id
            ? "This entry is older than 72 hours and can no longer be edited."
            : "You have read-only access for this sales entry."}
        </p>
      )}
    </div>
  );
}
