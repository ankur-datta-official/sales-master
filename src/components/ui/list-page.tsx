import * as React from "react";

import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export function ListPageShell({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {children}
    </div>
  );
}

export function ListPageHeader({
  title,
  description,
  actions,
  meta,
  variant = "surface",
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  variant?: "plain" | "surface";
  className?: string;
}) {
  if (variant === "plain") {
    return (
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        className={className}
      />
    );
  }

  return (
    <div
      data-slot="list-page-hero"
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-border/80 bg-card/82 shadow-[var(--shadow-md)] backdrop-blur-sm",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_48%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
      />
      <div className="relative p-4 md:p-5">
        <PageHeader title={title} description={description} actions={actions} />
        {meta ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ListSummaryRow({
  left,
  right,
  className,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="list-summary-row"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/72 px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur-sm",
        "sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="text-sm text-muted-foreground">{left}</div>
      {right ? <div className="text-sm">{right}</div> : null}
    </div>
  );
}
