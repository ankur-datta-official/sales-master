import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getRolePresentation } from "@/lib/auth/role-presentation";
import { canViewWorkspaceSettings } from "@/lib/users/actor-permissions";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewWorkspaceSettings(role)) {
    redirect(ROUTES.dashboard);
  }
  const rolePresentation = getRolePresentation(role);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Workspace preference controls and a quick view of the signed-in operational profile."
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme preference is shared across the authenticated workspace shell.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3 rounded-2xl border bg-background/45 p-4">
            <div>
              <p className="text-sm font-semibold">Theme Mode</p>
              <p className="text-sm text-muted-foreground">Switch between light, dark, and system appearance.</p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Snapshot</CardTitle>
            <CardDescription>These fields come from the current authenticated profile and role presentation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-background/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Name</p>
              <p className="mt-2 text-sm font-medium">{profile?.full_name ?? user.email ?? "Account"}</p>
            </div>
            <div className="rounded-2xl border bg-background/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email</p>
              <p className="mt-2 text-sm font-medium">{user.email ?? "-"}</p>
            </div>
            <div className="rounded-2xl border bg-background/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Role</p>
              <p className="mt-2 text-sm font-medium">{rolePresentation.shortTitle}</p>
            </div>
            <div className="rounded-2xl border bg-background/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
              <p className="mt-2 text-sm font-medium">{rolePresentation.workspaceLabel}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
