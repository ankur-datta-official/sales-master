"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { getWorkspaceDefinition } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import type { AppRole } from "@/constants/roles";
import { getRolePresentation } from "@/lib/auth/role-presentation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  /** Resolved from JWT metadata or profiles table when RBAC is wired */
  userRole?: AppRole | null;
  userEmail?: string | null;
  userDisplayName?: string | null;
};

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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const rolePresentation = getRolePresentation(userRole);
  const workspace = getWorkspaceDefinition(userRole);
  const iconToneByHref: Record<string, string> = {
    "/dashboard":
      "bg-[linear-gradient(135deg,#eef7ff,#d7ebff)] text-sky-700 ring-1 ring-sky-200/85",
    "/analytics":
      "bg-[linear-gradient(135deg,#ecfeff,#d3f6ff)] text-cyan-700 ring-1 ring-cyan-200/85",
    "/users":
      "bg-[linear-gradient(135deg,#ecfdf5,#d7f7e5)] text-emerald-700 ring-1 ring-emerald-200/80",
    "/field-activity":
      "bg-[linear-gradient(135deg,#ecfdf5,#d0fae5)] text-teal-700 ring-1 ring-teal-200/85",
    "/parties":
      "bg-[linear-gradient(135deg,#ecfeff,#cffafe)] text-cyan-700 ring-1 ring-cyan-200/85",
    "/visit-plans":
      "bg-[linear-gradient(135deg,#ecfeff,#cffafe)] text-cyan-700 ring-1 ring-cyan-200/85",
    "/notifications":
      "bg-[linear-gradient(135deg,#f0fdfa,#ccfbf1)] text-teal-700 ring-1 ring-teal-200/85",
    "/work-plans":
      "bg-[linear-gradient(135deg,#eef7ff,#dbeafe)] text-sky-700 ring-1 ring-sky-200/85",
    "/sales-targets":
      "bg-[linear-gradient(135deg,#fefce8,#fef3c7)] text-amber-700 ring-1 ring-amber-200/80",
    "/collection-targets":
      "bg-[linear-gradient(135deg,#fff7ed,#fed7aa)] text-orange-700 ring-1 ring-orange-200/80",
    "/demand-orders":
      "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-700 ring-1 ring-slate-200/85",
    "/collection-entries":
      "bg-[linear-gradient(135deg,#eef2ff,#e0e7ff)] text-indigo-700 ring-1 ring-indigo-200/85",
    "/factory-queue":
      "bg-[linear-gradient(135deg,#eff6ff,#dbeafe)] text-blue-700 ring-1 ring-blue-200/85",
    "/work-reports":
      "bg-[linear-gradient(135deg,#eef2ff,#e0e7ff)] text-indigo-700 ring-1 ring-indigo-200/85",
    "/documents":
      "bg-[linear-gradient(135deg,#eef2ff,#e0e7ff)] text-indigo-700 ring-1 ring-indigo-200/85",
    "/export-data":
      "bg-[linear-gradient(135deg,#eef2ff,#e0e7ff)] text-indigo-700 ring-1 ring-indigo-200/85",
    "/settings":
      "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-700 ring-1 ring-slate-200/85",
    "/profile":
      "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-700 ring-1 ring-slate-200/85",
  };
  const resolveIconTone = (href: string) =>
    iconToneByHref[href] ??
    "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] text-slate-700 ring-1 ring-slate-200/85";

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border/72 bg-transparent px-3 pb-2 pt-2.5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-[3.15rem] group-data-[collapsible=icon]:pt-3">
        <div className="relative rounded-[1.3rem] px-3.5 py-2.5 shadow-[0_10px_22px_color-mix(in_oklch,var(--sidebar-border)_8%,transparent)] group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0.5 group-data-[collapsible=icon]:shadow-none">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-[1rem] border border-cyan-100/80 bg-[linear-gradient(180deg,white,color-mix(in_oklch,var(--sidebar-accent)_38%,white))] text-sidebar-primary shadow-[0_12px_22px_color-mix(in_oklch,var(--sidebar-border)_10%,transparent)] ring-1 ring-sidebar-border/45 group-data-[collapsible=icon]:size-[3.1rem]">
              <div className="flex size-6.5 items-center justify-center rounded-full bg-[linear-gradient(180deg,color-mix(in_oklch,var(--sidebar-primary)_88%,white),var(--sidebar-primary))] text-sidebar-primary-foreground">
                <span className="text-[0.66rem] font-semibold tracking-tight">SM</span>
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white"
              />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-[0.93rem] font-semibold tracking-tight text-sidebar-foreground">
                Sales Master
              </div>
              <div className="mt-0.5 truncate text-[0.72rem] font-medium text-sidebar-foreground/55">
                {rolePresentation.workspaceLabel}
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "pointer-events-none absolute z-30 hidden md:block",
            isCollapsed
              ? "bottom-1.5 left-1/2 -translate-x-1/2"
              : "right-[1.5rem] top-1/2 -translate-y-1/2 translate-x-1/2"
          )}
        >
          <SidebarTrigger
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "pointer-events-auto border border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,252,0.96))] text-sidebar-foreground ring-1 ring-white/75 transition-[width,height,box-shadow,border-color,background-color,transform] duration-200 ease-out motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
              "shadow-[0_16px_30px_color-mix(in_oklch,var(--sidebar-border)_16%,transparent),0_3px_10px_rgba(255,255,255,0.72)_inset] hover:border-sidebar-ring/45 hover:bg-white hover:shadow-[0_20px_34px_color-mix(in_oklch,var(--sidebar-border)_18%,transparent),0_4px_12px_rgba(255,255,255,0.82)_inset] active:scale-[0.98]",
              isCollapsed
                ? "size-[2.7rem] rounded-[0.8rem]"
                : "size-[2.7rem] rounded-[0.8rem]"
            )}
          >
            <span className="flex items-center justify-center">
              {isCollapsed ? (
                <ChevronRight className="size-4.5 stroke-[2.1]" />
              ) : (
                <ChevronLeft className="size-4.5 stroke-[2.1]" />
              )}
            </span>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2 group-data-[collapsible=icon]:pt-2">
        <div className="hidden justify-center py-1 group-data-[collapsible=icon]:flex">
          <span className="size-1.5 rounded-full bg-[linear-gradient(180deg,#cbd5e1,#94a3b8)] shadow-[0_0_0_4px_rgba(241,245,249,0.98)]" />
        </div>
        {workspace.sections.map((group, index) => (
          <div key={group.label}>
            <SidebarGroup className="gap-1 py-1 first:pt-2 group-data-[collapsible=icon]:gap-0.5 group-data-[collapsible=icon]:py-1 group-data-[collapsible=icon]:first:pt-1">
              <SidebarGroupLabel className="mb-0.5 group-data-[collapsible=icon]:mb-0">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={`${group.label}:${item.title}:${item.href}`}>
                      <SidebarMenuButton
                        isActive={
                          pathname === item.href || pathname.startsWith(`${item.href}/`)
                        }
                        tooltip={item.title}
                        size="lg"
                        className="mx-1 my-0.5 group-data-[collapsible=icon]:my-1"
                        render={<Link href={item.href} />}
                      >
                        <item.icon className={resolveIconTone(item.href)} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {index < workspace.sections.length - 1 ? (
              <div className="hidden justify-center py-1 group-data-[collapsible=icon]:flex">
                <span className="size-1.5 rounded-full bg-[linear-gradient(180deg,#cbd5e1,#94a3b8)] shadow-[0_0_0_4px_rgba(241,245,249,0.98)]" />
              </div>
            ) : null}
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 bg-transparent px-3 pb-2.5 pt-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-2 group-data-[collapsible=icon]:pt-2.5">
        <Link
          href={ROUTES.profile}
          className="group flex items-center gap-2.5 rounded-[1rem] border border-sidebar-border/75 bg-white/92 px-2.5 py-2.5 shadow-[0_8px_18px_color-mix(in_oklch,var(--sidebar-border)_9%,transparent)] transition-colors hover:bg-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-[1rem] group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-1.5"
        >
          <Avatar className="size-9 rounded-[0.95rem] ring-1 ring-sidebar-border/60 group-data-[collapsible=icon]:size-[2.65rem]">
            <AvatarFallback className="rounded-[0.95rem] bg-[linear-gradient(180deg,white,var(--sidebar-accent))] text-[0.78rem] font-semibold text-sidebar-foreground">
              {initialsFromName(userDisplayName ?? userEmail)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[0.82rem] font-semibold leading-none text-sidebar-foreground">
              {userDisplayName ?? "Account"}
            </p>
            <p className="mt-1 truncate text-[0.66rem] text-sidebar-foreground/58">
              {rolePresentation.shortTitle}
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-1.5 group-data-[collapsible=icon]:hidden sm:flex">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-emerald-600">
              On
            </span>
            <ChevronRight className="size-3.5 shrink-0 text-sidebar-foreground/35 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
