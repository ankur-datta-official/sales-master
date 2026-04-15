import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateSalesEntries, isOrgAdminRole } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreateSalesEntryForm } from "@/modules/sales-entries/components/create-sales-entry-form";

export default async function NewSalesEntryPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateSalesEntries(role)) {
    redirect(ROUTES.salesEntries);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New sales entry</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.salesEntries}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Back to sales entries
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const isAdmin = isOrgAdminRole(role);

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: assignableProfiles } = isAdmin
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("organization_id", orgId)
        .order("full_name", { ascending: true })
    : { data: null };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New sales entry</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "Record a manual sale for any user in your organization."
            : "Record your manual sale for a party."}
        </p>
      </div>
      <CreateSalesEntryForm
        organizationId={orgId}
        isAdmin={isAdmin}
        parties={parties ?? []}
        assignableProfiles={assignableProfiles ?? []}
      />
    </div>
  );
}
