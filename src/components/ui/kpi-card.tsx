import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type KpiCardProps = React.ComponentProps<typeof Card> & {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: StatusTone;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  badge,
  icon,
  className,
  ...props
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "py-0 ring-border/80 shadow-[var(--shadow-sm)]",
        "relative overflow-hidden bg-card/86 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-0.5",
          tone === "neutral" ? "bg-border" : "bg-[oklch(from_var(--status-info)_l_c_h)]",
          tone === "success" && "bg-[oklch(from_var(--status-success)_l_c_h)]",
          tone === "warning" && "bg-[oklch(from_var(--status-warning)_l_c_h)]",
          tone === "danger" && "bg-[oklch(from_var(--status-danger)_l_c_h)]"
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_7%,transparent),transparent)]"
      />
      <CardContent className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon ? (
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 [&>svg]:size-4">
                  {icon}
                </span>
              ) : null}
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
            </div>
            <p className="mt-1 text-[1.65rem] font-semibold tabular-nums tracking-tight">
              {value}
            </p>
            {hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
          {badge ? (
            <StatusBadge tone={tone} size="sm" className="mt-0.5">
              {badge}
            </StatusBadge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
