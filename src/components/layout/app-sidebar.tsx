"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { filterNavByRoles, mainNavigation } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import type { AppRole } from "@/constants/roles";

type AppSidebarProps = {
  /** Resolved from JWT metadata or profiles table when RBAC is wired */
  userRole?: AppRole | null;
  userEmail?: string | null;
  userDisplayName?: string | null;
};

type NavGroup = { label: string; titles: readonly string[] };

const NAV_GROUPS: readonly NavGroup[] = [
  { label: "Overview", titles: ["Dashboard", "Analytics"] },
  {
    label: "CRM",
    titles: ["CRM"],
  },
  { label: "Work", titles: ["Work Plans", "Work Reports", "Visit Plans", "Visit Logs"] },
  { label: "Targets", titles: ["Sales Targets", "Collection Targets"] },
  { label: "Entries", titles: ["Sales Entries", "Collection Entries"] },
  { label: "Workflow", titles: ["Demand Orders", "Approvals", "Accounts review", "Factory queue"] },
  { label: "Directory", titles: ["Users", "Parties", "Products"] },
  { label: "Personal", titles: ["Profile", "Attendance", "Field activity"] },
] as const;

function initialsFromName(name: string | null | undefined) {
  if (!name) return "SM";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "SM";
  }
  const letters = name.replace(/[^a-zA-Z]/g, "").slice(0, 2);
  return letters.toUpperCase() || "SM";
}

export function AppSidebar({ userRole, userEmail, userDisplayName }: AppSidebarProps) {
  const pathname = usePathname();
  const items = filterNavByRoles(mainNavigation, userRole);

  const grouped = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: items.filter((i) => group.titles.includes(i.title)),
  })).filter((g) => g.items.length > 0);

  const groupedTitles = new Set(grouped.flatMap((g) => g.items.map((i) => i.title)));
  const ungrouped = items.filter((i) => !groupedTitles.has(i.title));

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border/75 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--sidebar-accent)_42%,transparent),transparent)]">
        <div className="px-2 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-md)] ring-1 ring-sidebar-border/80">
              <span className="text-xs font-semibold tracking-tight">SM</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 -top-1 size-2.5 rounded-full bg-emerald-400 ring-2 ring-sidebar"
              />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-semibold tracking-tight">
                Sales Master
              </div>
              <div className="truncate text-xs text-muted-foreground">
                Executive workspace
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {grouped.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                      }
                      tooltip={item.title}
                      size="lg"
                      className="mx-1 my-0.5"
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {ungrouped.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Other</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ungrouped.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                      }
                      tooltip={item.title}
                      size="lg"
                      className="mx-1 my-0.5"
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/75 bg-sidebar/80">
        <Link
          href={ROUTES.profile}
          className="group flex items-center gap-3 rounded-2xl border border-sidebar-border/75 bg-sidebar-accent/35 px-2.5 py-2.5 shadow-[var(--shadow-xs)] transition-colors hover:bg-sidebar-accent/70"
        >
          <Avatar className="size-9 rounded-2xl">
            <AvatarFallback>
              {initialsFromName(userDisplayName ?? userEmail)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium leading-none">
              {userDisplayName ?? "Account"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail ?? "—"}</p>
          </div>
          <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
