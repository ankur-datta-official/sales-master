import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

import { CrmWorkspaceNav } from "@/modules/crm/components/crm-workspace-nav";
import { CRM_QUICK_ACTIONS } from "@/modules/crm/workspace";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CrmWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border bg-card/85 p-5 shadow-[var(--shadow-lg)] md:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_50%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
        />
        <div className="relative space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <Sparkles className="size-3.5" />
                Unified CRM
              </div>
              <h1 className="mt-4 text-display">CRM Workspace</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Sales Master CRM is now organized as one smooth operating module.
                Start from overview, move into the exact section you need, and keep
                the team workflow visually connected from lead to report.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
              {CRM_QUICK_ACTIONS.map((action, index) => (
                <Link
                  key={action.key}
                  href={action.href}
                  className={cn(
                    buttonVariants({
                      variant: index === 0 ? "default" : "soft",
                      size: "sm",
                    }),
                    "rounded-2xl"
                  )}
                >
                  <Plus />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/72 p-3 shadow-[var(--shadow-sm)] backdrop-blur">
            <CrmWorkspaceNav />
          </div>
        </div>
      </section>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
