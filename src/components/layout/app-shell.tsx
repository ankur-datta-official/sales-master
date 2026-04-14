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
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <SidebarInset className="flex min-h-svh flex-col overflow-x-hidden">
        <AppTopbar userEmail={userEmail} userDisplayName={userDisplayName} />
        <ContentContainer>{children}</ContentContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
