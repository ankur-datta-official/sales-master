import * as React from "react";

import { cn } from "@/lib/utils";

type TableShellProps = React.ComponentProps<"div"> & {
  /** Used for screen readers when wrapping a table */
  label?: string;
};

export function TableShell({
  className,
  label = "Table",
  children,
  ...props
}: TableShellProps) {
  return (
    <div
      data-slot="table-shell"
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card/86 shadow-[var(--shadow-md)] backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
