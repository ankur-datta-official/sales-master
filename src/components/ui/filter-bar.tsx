import * as React from "react";

import { cn } from "@/lib/utils";

type FilterBarProps = React.ComponentProps<"div"> & {
  /** Optional slot for right-aligned actions (Apply/Reset, export, etc.) */
  actions?: React.ReactNode;
};

export function FilterBar({
  className,
  actions,
  children,
  ...props
}: FilterBarProps) {
  return (
    <div
      data-slot="filter-bar"
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/75 backdrop-blur-sm",
        "shadow-[var(--shadow-md)]",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/35 to-transparent opacity-80"
      />
      <div className="flex flex-col gap-3 p-3 md:p-4">
        <div className="grid gap-2">{children}</div>
        {actions ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

