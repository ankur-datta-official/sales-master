"use client";

import { Bell, ChevronDown, MessageSquare, LogOut, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { TopbarInboxMenu } from "@/components/layout/topbar-inbox-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getWorkspaceDefinition } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import type { AppRole } from "@/constants/roles";
import { getRolePresentation } from "@/lib/auth/role-presentation";
import { createClient } from "@/lib/supabase/client";
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
  const rolePresentation = getRolePresentation(userRole);
  const workspace = getWorkspaceDefinition(userRole);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.login);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-border/75 bg-background/92 px-3 shadow-[0_1px_0_color-mix(in_oklch,var(--border)_78%,transparent)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/82 md:px-5 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3">
        <div className="hidden w-full max-w-[560px] items-center rounded-xl border border-border/75 bg-card/72 px-3 shadow-[var(--shadow-xs)] lg:flex">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search"
            placeholder={workspace.searchPlaceholder}
            className="h-9 min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <TopbarInboxMenu
            title="Messages"
            endpoint="/api/topbar/messages"
            href={ROUTES.messages}
            ariaLabel="Messages"
            icon={MessageSquare}
            emptyTitle="No workflow conversations yet."
            emptyDetail="Recent approval and workflow discussions will appear here."
            kind="messages"
          />
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
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-10 gap-2.5 rounded-xl border border-border/75 bg-card/82 py-1 pl-1.5 pr-2.5 outline-none shadow-none hover:border-primary/25 hover:bg-card data-[state=open]:border-primary/30 data-[state=open]:bg-card"
              )}
            >
              <Avatar className="size-8 rounded-[12px]">
                <AvatarFallback>
                  {initialsFromName(userDisplayName ?? userEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 text-left md:block">
                <p className="max-w-[180px] truncate text-sm font-semibold leading-none">
                  {userDisplayName ?? "Account"}
                </p>
                <p className="mt-1 truncate text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
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
