import * as React from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export function DetailPageShell({
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

export function DetailHeader({
  backHref,
  backLabel,
  title,
  description,
  badges,
  actions,
}: {
  backHref: string;
  backLabel: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      data-slot="detail-hero"
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/75 shadow-[var(--shadow-md)]"
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative p-4 md:p-6">
        <PageHeader
          leading={
            <Link
              href={backHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 px-2 text-muted-foreground ring-1 ring-transparent hover:bg-muted/40 hover:text-foreground hover:ring-border/70"
              )}
            >
              ← {backLabel}
            </Link>
          }
          title={
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="min-w-0 truncate">{title}</span>
              {badges ? (
                <span className="flex items-center gap-1.5">{badges}</span>
              ) : null}
            </div>
          }
          description={description}
          actions={actions}
        />
      </div>
    </div>
  );
}

export function MetadataCard({
  title = "Summary",
  description,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("bg-card/75 shadow-[var(--shadow-md)]", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base tracking-tight">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function KeyValueGrid({
  className,
  children,
  columns = "default",
}: {
  className?: string;
  children: React.ReactNode;
  columns?: "default" | "wide";
}) {
  return (
    <dl
      data-slot="key-value-grid"
      data-columns={columns}
      className={cn(
        "grid gap-y-3 gap-x-6 text-sm",
        "sm:grid-cols-[minmax(0,180px)_1fr]",
        "data-[columns=wide]:sm:grid-cols-[minmax(0,220px)_1fr]",
        className
      )}
    >
      {children}
    </dl>
  );
}

export function KV({
  label,
  value,
  mono = false,
  subtle = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
  subtle?: boolean;
}) {
  return (
    <>
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "font-medium text-foreground/90",
          mono && "font-mono text-xs font-medium",
          subtle && "text-muted-foreground font-normal"
        )}
      >
        {value}
      </dd>
    </>
  );
}

export function ActionCard({
  title,
  description,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("bg-card/75 shadow-[var(--shadow-md)]", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base tracking-tight">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className,
  variant = "plain",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "plain" | "surface";
}) {
  return (
    <section className={cn("space-y-3", className)} data-slot="detail-section">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {variant === "surface" ? (
        <div className="rounded-2xl border bg-background/40 p-3 shadow-[var(--shadow-sm)]">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <StatusBadge tone={tone} size="sm">
      {children}
    </StatusBadge>
  );
}

