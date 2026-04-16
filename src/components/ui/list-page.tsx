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
        "relative overflow-hidden rounded-2xl border bg-card/75 shadow-[var(--shadow-md)]",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
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
        "flex flex-col gap-2 rounded-2xl border bg-card/60 px-4 py-3 shadow-[var(--shadow-sm)]",
        "sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="text-sm text-muted-foreground">{left}</div>
      {right ? <div className="text-sm">{right}</div> : null}
    </div>
  );
}

