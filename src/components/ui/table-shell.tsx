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
        "overflow-hidden rounded-2xl border bg-card/80 shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

