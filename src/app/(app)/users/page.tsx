import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import {
  normalizeProfileRow,
  PROFILE_WITH_ROLE_SELECT,
} from "@/lib/profiles/fetch-profile";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { OrganizationJoinRequest } from "@/modules/auth/types";
import { JoinRequestReviewPanel } from "@/modules/users/components/join-request-review-panel";
import { loadUserFormOptions } from "@/modules/users/load-form-options";
import { canMutateOrgUsers } from "@/lib/users/actor-permissions";

const ROLE_PRIORITY: Record<string, number> = {
  admin: 1,
  hos: 2,
  manager: 3,
  assistant_manager: 4,
  accounts: 5,
  factory_operator: 6,
  marketer: 7,
};

export default async function UsersListPage() {
  const supabase = await createClient();
  const { user, profile: actorProfile } = await requireUserProfile();
  const actorRole = resolveAppRole(user, actorProfile);
  const canEdit = canMutateOrgUsers(actorRole);
  const organizationId = actorProfile?.organization_id;

  const { data: rows, error } = await supabase
    .from("profiles")
    .select(PROFILE_WITH_ROLE_SELECT)
    .order("full_name", { ascending: true });

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-destructive text-sm">
          Could not load users right now.
        </p>
      </div>
    );
  }

  const profiles = (rows ?? [])
    .map((row) => normalizeProfileRow(row))
    .filter((profile): profile is NonNullable<typeof profile> => profile !== null)
    .toSorted((a, b) => {
      const aRank = ROLE_PRIORITY[a.role ?? ""] ?? 999;
      const bRank = ROLE_PRIORITY[b.role ?? ""] ?? 999;
      if (aRank !== bRank) return aRank - bRank;

      const aName = (a.full_name ?? "").toLocaleLowerCase();
      const bName = (b.full_name ?? "").toLocaleLowerCase();
      if (aName !== bName) return aName.localeCompare(bName);

      return (a.email ?? "").toLocaleLowerCase().localeCompare(
        (b.email ?? "").toLocaleLowerCase()
      );
    });

  let pendingJoinRequests: OrganizationJoinRequest[] = [];
  let formOptions:
    | Awaited<ReturnType<typeof loadUserFormOptions>>
    | null = null;

  if (canEdit && organizationId) {
    formOptions = await loadUserFormOptions(supabase, organizationId);
    try {
      const service = createServiceRoleClient();
      const { data: joinRows } = await service
        .from("organization_join_requests")
        .select(
          "id, organization_id, user_id, email, full_name, requested_role_id, requested_branch_id, note, status, reviewed_by, reviewed_at, review_note, created_at, updated_at, organizations ( name, slug )"
        )
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      pendingJoinRequests = ((joinRows ?? []) as Array<Record<string, unknown>>).map(
        (row) => {
          const organization =
            row.organizations &&
            typeof row.organizations === "object" &&
            !Array.isArray(row.organizations)
              ? (row.organizations as Record<string, unknown>)
              : null;

          return {
            id: String(row.id),
            organization_id: String(row.organization_id),
            organization_name:
              organization && typeof organization.name === "string"
                ? organization.name
                : null,
            organization_slug:
              organization && typeof organization.slug === "string"
                ? organization.slug
                : null,
            user_id: String(row.user_id),
            email: String(row.email ?? ""),
            full_name: String(row.full_name ?? ""),
            requested_role_id:
              typeof row.requested_role_id === "string"
                ? row.requested_role_id
                : null,
            requested_branch_id:
              typeof row.requested_branch_id === "string"
                ? row.requested_branch_id
                : null,
            note: typeof row.note === "string" ? row.note : null,
            status: "pending",
            reviewed_by:
              typeof row.reviewed_by === "string" ? row.reviewed_by : null,
            reviewed_at:
              typeof row.reviewed_at === "string" ? row.reviewed_at : null,
            review_note:
              typeof row.review_note === "string" ? row.review_note : null,
            created_at:
              typeof row.created_at === "string"
                ? row.created_at
                : new Date().toISOString(),
            updated_at:
              typeof row.updated_at === "string"
                ? row.updated_at
                : new Date().toISOString(),
          } satisfies OrganizationJoinRequest;
        }
      );
    } catch {
      pendingJoinRequests = [];
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            {canEdit
              ? "Organization directory and pending workspace access requests."
              : "Read-only directory for the users visible to your reporting scope."}
          </p>
        </div>
        {canEdit ? (
          <Link
            href={ROUTES.usersNew}
            className={cn(
              buttonVariants(),
              "inline-flex h-9 items-center justify-center px-4"
            )}
          >
            New user
          </Link>
        ) : null}
      </div>

      {canEdit && formOptions ? (
        <JoinRequestReviewPanel
          requests={pendingJoinRequests}
          roles={formOptions.roles}
          branches={formOptions.branches}
        />
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="w-24 px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-3 py-8 text-center"
                >
                  No users visible for your account.
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">
                    {profile.full_name ?? "-"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {profile.email ?? "-"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {profile.role ?? "-"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {profile.status ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.users}/${profile.id}`}
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
