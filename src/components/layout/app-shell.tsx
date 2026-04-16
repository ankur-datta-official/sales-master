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
    <SidebarProvider className="bg-gradient-to-br from-sidebar/25 via-background to-muted/15">
      <AppSidebar
        userRole={userRole}
        userEmail={userEmail}
        userDisplayName={userDisplayName}
      />
      <SidebarInset className="flex min-h-svh flex-col overflow-x-hidden bg-gradient-to-b from-background via-background to-muted/12">
        <AppTopbar userEmail={userEmail} userDisplayName={userDisplayName} />
        <ContentContainer>{children}</ContentContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
