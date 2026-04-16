import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = React.ComponentProps<"div"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border bg-card/60 px-6 py-10 text-center",
        "shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground ring-1 ring-foreground/10 shadow-[var(--shadow-xs)]">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      {description ? (
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

