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

export default async function ProfilePage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const displayName = getUserDisplayName(profile, user);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="text-muted-foreground text-sm">
        Data from Supabase Auth and the `profiles` table.
      </p>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Basic identity — extend when you add more profile fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">Display name</dt>
            <dd className="font-medium break-all">{displayName}</dd>

            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all font-mono text-xs">{user.email ?? "—"}</dd>

            <dt className="text-muted-foreground">User ID</dt>
            <dd className="break-all font-mono text-xs">{user.id}</dd>

            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-mono text-xs">
              {role ?? "— (no resolved role yet)"}
            </dd>

            <dt className="text-muted-foreground">Profile row</dt>
            <dd className="font-mono text-xs">
              {profile
                ? "Loaded"
                : "Unavailable — create/migrate public.profiles in Supabase to enable app profile data"}
            </dd>

            {profile?.full_name != null && (
              <>
                <dt className="text-muted-foreground">Full name</dt>
                <dd>{profile.full_name}</dd>
              </>
            )}
            {profile?.updated_at != null && (
              <>
                <dt className="text-muted-foreground">Profile updated</dt>
                <dd className="font-mono text-xs">{profile.updated_at}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
