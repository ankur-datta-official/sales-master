import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canViewWorkspaceDocuments } from "@/lib/users/actor-permissions";
import { getWorkspaceDocuments } from "@/modules/workspace-insights/service";
import { redirect } from "next/navigation";

export default async function DocumentsPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewWorkspaceDocuments(role)) {
    redirect(ROUTES.dashboard);
  }
  const supabase = await createClient();
  const documents = await getWorkspaceDocuments({
    supabase,
    role,
    userId: profile?.id ?? user.id,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Recent operational documents collected from work plans, work reports, demand orders, and delivery challans."
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Open a document to continue review in its source workflow.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b bg-muted/35">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      No operational documents were found.
                    </td>
                  </tr>
                ) : (
                  documents.map((document) => (
                    <tr key={document.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{document.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{document.type}</td>
                      <td className="px-3 py-2 text-muted-foreground">{document.owner}</td>
                      <td className="px-3 py-2 font-mono text-xs">{document.date}</td>
                      <td className="px-3 py-2">
                        <StatusBadge tone="info">{document.status}</StatusBadge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link href={document.href} className="text-primary font-medium underline-offset-4 hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
