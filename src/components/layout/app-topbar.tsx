"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AppTopbarProps = {
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

export function AppTopbar({ userEmail, userDisplayName }: AppTopbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.login);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 shadow-[var(--shadow-sm)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1560px] items-center gap-2 px-3 md:px-6 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <div className="h-6 w-px bg-border/60" aria-hidden="true" />
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold tracking-tight">Sales Master</p>
          <p className="truncate text-xs text-muted-foreground">Operational workspace</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-2 px-2 outline-none ring-1 ring-transparent hover:ring-border/60 data-[state=open]:ring-border/70 data-[state=open]:bg-muted/50"
              )}
            >
              <Avatar className="size-8">
                <AvatarFallback>
                  {initialsFromName(userDisplayName ?? userEmail)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[220px] truncate text-sm font-medium md:inline">
                {userDisplayName ?? "Account"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Signed in as</span>
                    <span className="truncate text-sm">{userEmail ?? "—"}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(ROUTES.profile)}>
                <UserRound />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
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
