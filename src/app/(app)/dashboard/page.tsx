import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";

export default async function DashboardPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const displayName = getUserDisplayName(profile, user);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Foundation placeholder — domain modules will extend this area later.
      </p>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
          <CardDescription>Session summary from your profile and auth user.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{displayName}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium font-mono text-xs">
                {role ?? "— (resolve from roles/profile data or JWT metadata)"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
