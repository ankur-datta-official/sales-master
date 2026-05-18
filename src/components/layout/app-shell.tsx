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
      defaultOpen
      className="h-dvh min-h-dvh overflow-hidden bg-[linear-gradient(180deg,color-mix(in_oklch,white_88%,var(--sidebar))_0%,color-mix(in_oklch,white_94%,var(--background))_18%,color-mix(in_oklch,var(--muted)_18%,white)_100%)]"
    >
      <AppSidebar
        userRole={userRole}
        userEmail={userEmail}
        userDisplayName={userDisplayName}
      />
      <SidebarInset className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.75)_0%,color-mix(in_oklch,white_96%,var(--background))_12%,var(--background)_32%,color-mix(in_oklch,var(--muted)_26%,transparent)_100%)]">
        <AppTopbar
          userEmail={userEmail}
          userDisplayName={userDisplayName}
          userRole={userRole}
        />
        <ContentContainer>{children}</ContentContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
