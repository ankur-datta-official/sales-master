import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { PARTY_STATUSES } from "@/constants/statuses";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canMutateParties } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import type { PartyWithAssignee } from "@/modules/parties/types";
import { mapPartyRow } from "@/modules/parties/normalize";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function PartiesPage({ searchParams }: PageProps) {
  const { q = "", status = "" } = await searchParams;

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const canEdit = canMutateParties(role);

  let query = supabase
    .from("parties")
    .select(
      "id, organization_id, assigned_to_user_id, name, code, contact_person, phone, email, address, notes, status, created_by_user_id, created_at, updated_at, assignee:profiles!parties_assigned_to_user_id_fkey(full_name, email)"
    )
    .order("name", { ascending: true });

  if (q.trim()) {
    const safe = q.replace(/[%_]/g, "").trim();
    query = query.or(
      `name.ilike.%${safe}%,code.ilike.%${safe}%,contact_person.ilike.%${safe}%`
    );
  }
  if (status && PARTY_STATUSES.includes(status as (typeof PARTY_STATUSES)[number])) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Parties</h1>
        <p className="text-destructive text-sm">Could not load parties right now.</p>
      </div>
    );
  }

  const parties: PartyWithAssignee[] = (data ?? []).map((row) =>
    mapPartyRow(row as Parameters<typeof mapPartyRow>[0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parties</h1>
          <p className="text-muted-foreground text-sm">
            {canEdit
              ? "Manage parties and assignments."
              : "Read-only parties visible in your hierarchy scope."}
          </p>
        </div>
        {canEdit && (
          <Link
            href={ROUTES.partiesNew}
            className={cn(buttonVariants(), "inline-flex h-9 items-center justify-center px-4")}
          >
            New party
          </Link>
        )}
      </div>

      <form className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, code, contact"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All statuses</option>
          {PARTY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        >
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Party</th>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Assigned</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium w-24" />
            </tr>
          </thead>
          <tbody>
            {parties.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-3 py-8 text-center">
                  No parties visible for your account.
                </td>
              </tr>
            ) : (
              parties.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.code ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.assignee_name ?? p.assignee_email ?? "Unassigned"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.status}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.parties}/${p.id}`}
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
