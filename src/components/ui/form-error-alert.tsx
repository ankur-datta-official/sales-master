"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type Props = {
  message: string | null | undefined;
  className?: string;
};

export function FormErrorAlert({ message, className }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground",
        "shadow-[var(--shadow-xs)]",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <StatusBadge tone="danger" size="sm">
          Error
        </StatusBadge>
        <p className="text-sm text-destructive">{message}</p>
      </div>
    </div>
  );
}
