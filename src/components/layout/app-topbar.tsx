"use client";
import { Bell, ChevronDown, LogOut, Menu, MessageSquareMore, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { ExternalCrmHandoffCta } from "@/components/auth/external-crm-handoff-cta";
import { TopbarInboxMenu } from "@/components/layout/topbar-inbox-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { getWorkspaceDefinition } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import type { AppRole } from "@/constants/roles";
import { getRolePresentation } from "@/lib/auth/role-presentation";
import { createClient } from "@/lib/supabase/client";
import { canViewWorkspaceMessages, canViewWorkspaceNotifications } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";

type AppTopbarProps = {
  userEmail?: string | null;
  userDisplayName?: string | null;
  userRole?: AppRole | null;
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

export function AppTopbar({ userEmail, userDisplayName, userRole }: AppTopbarProps) {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const rolePresentation = getRolePresentation(userRole);
  const workspace = getWorkspaceDefinition(userRole);
  const canOpenNotifications = canViewWorkspaceNotifications(userRole);
  const canOpenMessages = canViewWorkspaceMessages(userRole);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.login);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-[4.1rem] shrink-0 items-center border-b border-border/62 bg-background/80 px-0 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="flex w-full items-center gap-3 bg-white/72 px-3 py-2 shadow-[0_8px_24px_color-mix(in_oklch,var(--border)_8%,transparent)] md:px-4">
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-10 rounded-[1rem] border border-border/75 bg-background/92 text-muted-foreground shadow-[0_4px_12px_color-mix(in_oklch,var(--border)_7%,transparent)] hover:bg-white md:hidden"
          onClick={toggleSidebar}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>
        <div className="flex w-full max-w-[22rem] items-center rounded-[1rem] border border-border/75 bg-background/88 px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_3px_10px_color-mix(in_oklch,var(--border)_7%,transparent)] sm:max-w-[26rem] lg:max-w-[34rem]">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search"
            placeholder={workspace.searchPlaceholder}
            className="h-9 min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <ExternalCrmHandoffCta variant="header" />
        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          {canOpenNotifications ? (
            <TopbarInboxMenu
              title="Notifications"
              endpoint="/api/topbar/notifications"
              href={ROUTES.notifications}
              ariaLabel="Notifications"
              icon={Bell}
              emptyTitle="No live notifications right now."
              emptyDetail="New workflow alerts and handoff reminders will appear here."
              kind="notifications"
            />
          ) : null}
          {canOpenMessages ? (
            <TopbarInboxMenu
              title="Messages"
              endpoint="/api/topbar/messages"
              href={ROUTES.messages}
              ariaLabel="Messages"
              icon={MessageSquareMore}
              emptyTitle="No active messages right now."
              emptyDetail="New conversation threads and replies will appear here."
              kind="messages"
            />
          ) : null}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-11 gap-2 rounded-[1rem] border border-border/75 bg-background/92 py-1 pl-1.5 pr-2.5 outline-none shadow-[0_4px_12px_color-mix(in_oklch,var(--border)_7%,transparent)] hover:border-primary/16 hover:bg-white data-[state=open]:border-primary/20 data-[state=open]:bg-white"
              )}
            >
              <Avatar className="size-8 rounded-[0.9rem]">
                <AvatarFallback>
                  {initialsFromName(userDisplayName ?? userEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 text-left md:block">
                <p className="max-w-[180px] truncate text-[0.82rem] font-semibold leading-none">
                  {userDisplayName ?? "Account"}
                </p>
                <p className="mt-1 truncate text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {rolePresentation.shortTitle}
                </p>
              </div>
              <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="min-w-64 rounded-[22px] border-border/80 bg-popover/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-3 font-normal">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 rounded-xl">
                      <AvatarFallback>
                        {initialsFromName(userDisplayName ?? userEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {userDisplayName ?? "Account"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {rolePresentation.shortTitle}
                        {userEmail ? ` - ${userEmail}` : ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(ROUTES.messages)}
                className="rounded-xl px-3 py-2.5"
              >
                <MessageSquareMore />
                Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(ROUTES.profile)}
                className="rounded-xl px-3 py-2.5"
              >
                <UserRound />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleSignOut}
                className="rounded-xl px-3 py-2.5"
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
