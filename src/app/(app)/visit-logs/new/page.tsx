import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateVisitLogs, isOrgAdminRole } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { CreateVisitLogForm } from "@/modules/visit-logs/components/create-visit-log-form";
import type { VisitPlanLinkOption } from "@/modules/visit-logs/types";

export default async function NewVisitLogPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateVisitLogs(role)) {
    redirect(ROUTES.visitLogs);
  }

  const orgId = profile?.organization_id;
  if (!orgId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New visit log</h1>
        <p className="text-muted-foreground text-sm">
          Your profile must have an organization assigned first.
        </p>
        <Link
          href={ROUTES.visitLogs}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex h-9 items-center justify-center px-4"
          )}
        >
          Back to visit logs
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

  const { data: planRows } = await supabase
    .from("visit_plans")
    .select("id, party_id, user_id, visit_date, purpose")
    .order("visit_date", { ascending: false })
    .limit(300);

  const linkableVisitPlans: VisitPlanLinkOption[] = (planRows ?? []).map((r) => ({
    id: r.id,
    party_id: r.party_id,
    user_id: r.user_id,
    visit_date: r.visit_date,
    purpose: r.purpose,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New visit log</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "Record a visit for any user in your organization."
            : "Record your field visit and optionally link a visit plan."}
        </p>
      </div>
      <CreateVisitLogForm
        organizationId={orgId}
        isAdmin={isAdmin}
        parties={parties ?? []}
        assignableProfiles={assignableProfiles ?? []}
        linkableVisitPlans={linkableVisitPlans}
      />
    </div>
  );
}
