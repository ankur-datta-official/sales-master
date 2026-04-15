import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { COLLECTION_ENTRY_VERIFICATION_STATUSES } from "@/constants/statuses";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateCollectionEntries } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { mapCollectionEntryRow } from "@/modules/collection-entries/normalize";
import type { CollectionEntryWithRelations } from "@/modules/collection-entries/types";

type PageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    scope?: string;
    user?: string;
    party?: string;
    verification?: string;
  }>;
};

export default async function CollectionEntriesPage({ searchParams }: PageProps) {
  const {
    dateFrom = "",
    dateTo = "",
    scope = "all",
    user = "",
    party = "",
    verification = "",
  } = await searchParams;

  const supabase = await createClient();
  const { user: authUser, profile } = await requireUserProfile();
  const role = resolveAppRole(authUser, profile);

  const { data: partyOptions } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  let query = supabase
    .from("collection_entries")
    .select(
      "id, organization_id, user_id, party_id, entry_date, amount, remarks, verification_status, created_by, created_at, updated_at, party:parties!collection_entries_party_id_fkey(name, code), collector:profiles!collection_entries_user_id_fkey(full_name, email), creator:profiles!collection_entries_created_by_fkey(full_name, email)"
    )
    .order("entry_date", { ascending: false });

  if (dateFrom && dateTo) {
    query = query.gte("entry_date", dateFrom).lte("entry_date", dateTo);
  } else if (dateFrom) {
    query = query.gte("entry_date", dateFrom);
  } else if (dateTo) {
    query = query.lte("entry_date", dateTo);
  }

  if (party) query = query.eq("party_id", party);
  if (user) query = query.eq("user_id", user);
  if (
    verification &&
    (COLLECTION_ENTRY_VERIFICATION_STATUSES as readonly string[]).includes(verification)
  ) {
    query = query.eq("verification_status", verification);
  }
  if (scope === "own" && profile?.id) query = query.eq("user_id", profile.id);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Collection entries</h1>
        <p className="text-destructive text-sm">Could not load collection entries: {error.message}</p>
      </div>
    );
  }

  const rows: CollectionEntryWithRelations[] = (data ?? []).map((row) =>
    mapCollectionEntryRow(row as Parameters<typeof mapCollectionEntryRow>[0])
  );

  const partiesForFilter = partyOptions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collection entries</h1>
          <p className="text-muted-foreground text-sm">
            Collections by party. Visibility follows your role; accounts verify org-wide rows.
          </p>
        </div>
        {canCreateCollectionEntries(role) && (
          <Link
            href={ROUTES.collectionEntriesNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New entry
          </Link>
        )}
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-7">
        <input
          name="dateFrom"
          type="date"
          defaultValue={dateFrom}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <input
          name="dateTo"
          type="date"
          defaultValue={dateTo}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <select
          name="party"
          defaultValue={party}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All parties</option>
          {partiesForFilter.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="verification"
          defaultValue={verification}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All statuses</option>
          {COLLECTION_ENTRY_VERIFICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="scope"
          defaultValue={scope}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="all">All (within visibility)</option>
          <option value="own">Own entries only</option>
          <option value="team">Team (RLS visibility)</option>
        </select>
        <input
          name="user"
          placeholder="Collector user id"
          defaultValue={user}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 flex-1 px-4")}
          >
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Entry date</th>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Collector</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created by</th>
              <th className="px-3 py-2 w-20 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-3 py-8 text-center">
                  No collection entries found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.entry_date}</td>
                  <td className="px-3 py-2 font-medium">
                    {row.party_name ?? row.party_id}
                    {row.party_code ? (
                      <span className="text-muted-foreground ml-1 font-mono text-xs">
                        ({row.party_code})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.collector_name ?? row.collector_email ?? row.user_id}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.amount}</td>
                  <td className="px-3 py-2 font-mono text-xs capitalize">{row.verification_status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.creator_name ?? row.creator_email ?? row.created_by}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.collectionEntries}/${row.id}`}
                      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
