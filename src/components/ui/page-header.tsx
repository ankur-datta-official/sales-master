import * as React from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional left-side element (breadcrumb, back button, etc.) */
  leading?: React.ReactNode;
  /** Right-side actions (buttons/menus) */
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  leading,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)} data-slot="page-header">
      {leading ? <div className="flex items-center gap-2">{leading}</div> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="min-w-0 truncate text-display">{title}</h1>
          </div>
          {description ? (
            <p className="max-w-[80ch] text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

