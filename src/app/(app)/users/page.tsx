import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { normalizeProfileRow, PROFILE_WITH_ROLE_SELECT } from "@/lib/profiles/fetch-profile";
import { createClient } from "@/lib/supabase/server";
import { canMutateOrgUsers } from "@/lib/users/actor-permissions";

export default async function UsersListPage() {
  const supabase = await createClient();
  const { user, profile: actorProfile } = await requireUserProfile();
  const actorRole = resolveAppRole(user, actorProfile);
  const canEdit = canMutateOrgUsers(actorRole);

  const { data: rows, error } = await supabase
    .from("profiles")
    .select(PROFILE_WITH_ROLE_SELECT)
    .order("full_name", { ascending: true });

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-destructive text-sm">Could not load users right now.</p>
      </div>
    );
  }

  const profiles = (rows ?? [])
    .map((r) => normalizeProfileRow(r))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            {canEdit
              ? "Organization directory — admins can create and update users."
              : "Read-only directory — you see users in your reporting tree (and yourself)."}
          </p>
        </div>
        {canEdit && (
          <Link
            href={ROUTES.usersNew}
            className={cn(
              buttonVariants(),
              "inline-flex h-9 items-center justify-center px-4"
            )}
          >
            New user
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium w-24" />
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-3 py-8 text-center">
                  No users visible for your account.
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{p.full_name ?? "—"}</td>
                  <td className="text-muted-foreground px-3 py-2">{p.email ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.role ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.status ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`${ROUTES.users}/${p.id}`}
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
