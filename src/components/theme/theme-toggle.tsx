"use client";

import { useState, useSyncExternalStore } from "react";
import { LaptopMinimal, Moon, SunMedium } from "lucide-react";

import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof SunMedium;
}> = [
  {
    value: "light",
    label: "Light mode",
    shortLabel: "Light",
    description: "Bright workspace for daytime use.",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Dark mode",
    shortLabel: "Dark",
    description: "Low-glare view for focused work.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Device default",
    shortLabel: "Device",
    description: "Follow your device appearance.",
    icon: LaptopMinimal,
  },
];

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const activeTheme = isHydrated ? resolvedTheme : "light";
  const activeLabel =
    themeOptions.find((option) => option.value === theme)?.label ??
    "Device default";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-2xl border-border/80 bg-card/85 text-muted-foreground shadow-[var(--shadow-sm)] backdrop-blur hover:border-primary/30 hover:bg-card hover:text-foreground dark:bg-card/80 dark:hover:border-primary/40"
            aria-label="Change theme"
          />
        }
      >
        {activeTheme === "dark" ? (
          <Moon className="size-4.5" />
        ) : (
          <SunMedium className="size-4.5" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-64 rounded-[24px] border border-border/80 bg-popover/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3 px-2.5 pb-2 pt-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Appearance
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {activeLabel}
            </p>
          </div>
          <div className="min-w-[72px] rounded-full border border-border bg-muted/60 px-2.5 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {theme === "system" ? `Auto ${resolvedTheme}` : resolvedTheme}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const active = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[18px] border px-2 py-3 text-center transition-all duration-200",
                  "border-border/80 bg-muted/45 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card",
                  active &&
                    "border-primary/30 bg-primary/10 text-primary shadow-[0_14px_24px_-20px_color-mix(in_oklch,var(--primary)_70%,transparent)]"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-[var(--shadow-xs)]",
                    active && "border-primary/30 bg-primary/12 text-primary"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold">{option.shortLabel}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {option.value === "system" ? "Auto" : "Mode"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
