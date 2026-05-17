import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canViewWorkspaceExportData } from "@/lib/users/actor-permissions";
import { getExportLaunchpadData } from "@/modules/workspace-insights/service";

export default async function ExportDataPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewWorkspaceExportData(role)) {
    redirect(ROUTES.dashboard);
  }
  const supabase = await createClient();
  const launchpad = await getExportLaunchpadData({
    supabase,
    role,
    userId: profile?.id ?? user.id,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Export Data"
        description={launchpad.summary.description}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {launchpad.cards.map((item) => (
          <Card key={item.key}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">{item.statsLabel}</p>
              <Link href={item.href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Open module
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
