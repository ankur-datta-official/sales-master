"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CRM_QUICK_ACTIONS,
  CRM_WORKSPACE_SECTIONS,
  getCrmSectionFromSegment,
} from "@/modules/crm/workspace";

export function CrmWorkspaceNav() {
  const segment = useSelectedLayoutSegment();
  const activeSection = getCrmSectionFromSegment(segment);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground/80">
            CRM sections
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            One guided module flow for accounts, activities, documents, and reporting.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CRM_QUICK_ACTIONS.slice(0, 3).map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2 px-1">
          {CRM_WORKSPACE_SECTIONS.map((section) => {
            const isActive = section.key === activeSection.key;
            return (
              <Button
                key={section.key}
                render={<Link href={section.href} />}
                nativeButton={false}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-auto min-w-fit rounded-2xl px-3 py-2 text-left shadow-none",
                  !isActive && "bg-background/70 hover:bg-background"
                )}
              >
                <section.icon />
                <span className="flex flex-col items-start">
                  <span className="text-xs font-semibold tracking-tight">
                    {section.shortLabel}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[11px] leading-tight opacity-80 md:block",
                      isActive
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {section.description}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
