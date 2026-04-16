"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

type StatusBadgeProps = React.ComponentProps<"span"> & {
  tone?: StatusTone;
  size?: "sm" | "md";
};

const toneClasses: Record<StatusTone, string> = {
  neutral:
    "bg-muted/70 text-foreground/80 ring-foreground/10 dark:bg-muted/40 dark:ring-foreground/15",
  info: "bg-[oklch(from_var(--status-info)_l_c_h/0.12)] text-[oklch(from_var(--status-info)_l_c_h)] ring-[oklch(from_var(--status-info)_l_c_h/0.22)]",
  success:
    "bg-[oklch(from_var(--status-success)_l_c_h/0.12)] text-[oklch(from_var(--status-success)_l_c_h)] ring-[oklch(from_var(--status-success)_l_c_h/0.22)]",
  warning:
    "bg-[oklch(from_var(--status-warning)_l_c_h/0.14)] text-[oklch(from_var(--status-warning)_l_c_h)] ring-[oklch(from_var(--status-warning)_l_c_h/0.24)]",
  danger:
    "bg-[oklch(from_var(--status-danger)_l_c_h/0.12)] text-[oklch(from_var(--status-danger)_l_c_h)] ring-[oklch(from_var(--status-danger)_l_c_h/0.22)]",
};

export function StatusBadge({
  tone = "neutral",
  size = "md",
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-tone={tone}
      data-size={size}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        "ring-1 ring-inset shadow-[var(--shadow-xs)]",
        "backdrop-blur supports-[backdrop-filter]:bg-opacity-70",
        "data-[size=sm]:px-1.5 data-[size=sm]:py-0 data-[size=sm]:text-[0.7rem]",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

