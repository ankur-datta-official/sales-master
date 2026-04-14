import { AppShell } from "@/components/layout/app-shell";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireUserProfile();
  const userRole = resolveAppRole(user, profile);
  const userDisplayName = getUserDisplayName(profile, user);

  return (
    <AppShell
      userEmail={user.email}
      userDisplayName={userDisplayName}
      userRole={userRole}
    >
      {children}
    </AppShell>
  );
}
