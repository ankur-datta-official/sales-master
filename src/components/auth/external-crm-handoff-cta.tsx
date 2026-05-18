"use client";

import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { EXTERNAL_CRM } from "@/config/external-apps";
import { cn } from "@/lib/utils";

type ExternalCrmHandoffCtaProps = {
  variant?: "form" | "hero" | "header";
  className?: string;
};

export function ExternalCrmHandoffCta({
  variant = "form",
  className,
}: ExternalCrmHandoffCtaProps) {
  const isHero = variant === "hero";
  const isHeader = variant === "header";

  if (isHeader) {
    return (
      <Link
        href={EXTERNAL_CRM.workspaceUrl}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "hidden h-10 rounded-[1rem] border-border/75 bg-background/92 px-3 text-[0.78rem] font-semibold text-foreground shadow-[0_4px_12px_color-mix(in_oklch,var(--border)_7%,transparent)] hover:border-primary/16 hover:bg-white lg:inline-flex",
          className
        )}
        aria-label={EXTERNAL_CRM.ctaLabel}
      >
        <Building2 className="size-3.5 text-primary" />
        <span className="max-w-[9.5rem] truncate">{EXTERNAL_CRM.ctaLabel}</span>
        <ArrowUpRight className="size-3.5 text-muted-foreground" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-border/75 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_96%,white)_0%,color-mix(in_oklch,var(--background)_92%,var(--muted))_100%)] p-3.5 shadow-[0_10px_28px_color-mix(in_oklch,var(--border)_8%,transparent)]",
        isHero && "border-white/80 bg-white/72 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-[1rem] border border-primary/10 bg-primary/8 text-primary shadow-[var(--shadow-xs)]",
            isHero && "border-white/70 bg-white/78 text-slate-700"
          )}
        >
          <Building2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "text-sm font-semibold tracking-tight text-foreground",
                isHero && "text-slate-950"
              )}
            >
              {EXTERNAL_CRM.ctaLabel}
            </p>
            <span
              className={cn(
                "rounded-full border border-border/60 bg-background/88 px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
                isHero && "border-white/65 bg-white/78 text-slate-500"
              )}
            >
              External CRM
            </span>
          </div>
          <p
            className={cn(
              "mt-1 text-xs leading-5 text-muted-foreground",
              isHero && "text-slate-600"
            )}
          >
            {EXTERNAL_CRM.helperText}
          </p>

          <Link
            href={EXTERNAL_CRM.workspaceUrl}
            className={cn(
              buttonVariants({ variant: isHero ? "secondary" : "outline", size: "sm" }),
              "mt-3 inline-flex rounded-[0.95rem] border-border/70 bg-white/82 px-3 text-[0.78rem] font-semibold shadow-[var(--shadow-xs)] hover:bg-white",
              isHero &&
                "border-white/70 bg-white/86 text-slate-900 hover:bg-white"
            )}
          >
            {EXTERNAL_CRM.ctaLabel}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
