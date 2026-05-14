"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ContentContainer } from "@/components/layout/content-container";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { AppRole } from "@/constants/roles";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  userDisplayName?: string | null;
  userRole?: AppRole | null;
};

export function AppShell({
  children,
  userEmail,
  userDisplayName,
  userRole,
}: AppShellProps) {
  return (
    <SidebarProvider
      data-app-shell-root
      className="h-dvh min-h-dvh overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklch,var(--sidebar)_82%,transparent),var(--background)_48%,color-mix(in_oklch,var(--muted)_55%,transparent))]"
    >
      <AppSidebar
        userRole={userRole}
        userEmail={userEmail}
        userDisplayName={userDisplayName}
      />
      <SidebarInset className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,var(--background)_0%,var(--background)_70%,color-mix(in_oklch,var(--muted)_42%,transparent)_100%)]">
        <AppTopbar userEmail={userEmail} userDisplayName={userDisplayName} />
        <ContentContainer>{children}</ContentContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
