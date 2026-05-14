"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-border/70 bg-background/78 px-3 shadow-[var(--shadow-sm)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/68 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1560px] items-center gap-3">
        <SidebarTrigger className="-ml-1 rounded-2xl border border-border/70 bg-card/70 shadow-[var(--shadow-xs)] hover:border-primary/25" />
        <div className="h-6 w-px bg-border/60" aria-hidden="true" />
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold tracking-tight">
            Sales Master
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Operational workspace
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-11 gap-3 rounded-[20px] border border-border/75 bg-card/82 py-1.5 pl-1.5 pr-3 outline-none shadow-[var(--shadow-sm)] hover:border-primary/25 hover:bg-card data-[state=open]:border-primary/30 data-[state=open]:bg-card"
              )}
            >
              <Avatar className="size-9 rounded-[14px]">
                <AvatarFallback>
                  {initialsFromName(userDisplayName ?? userEmail)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[220px] truncate text-sm font-medium md:inline">
                {userDisplayName ?? "Account"}
              </span>
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
                        {userEmail ?? "Signed in"}
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
