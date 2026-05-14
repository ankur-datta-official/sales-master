import Link from "next/link";
import { Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPageShell, ListSummaryRow } from "@/components/ui/list-page";
import { PageHeader } from "@/components/ui/page-header";
import { nativeSelectClass } from "@/modules/crm/components/crm-fields";
import { labelize } from "@/modules/crm/normalize";
import { cn } from "@/lib/utils";

type CrmPageProps = {
  title: string;
  description: string;
  newHref?: string;
  newLabel?: string;
  total?: number;
  children: React.ReactNode;
  filters?: {
    q?: string;
    status?: string;
    priority?: string;
    statuses?: readonly string[];
    priorities?: readonly string[];
  };
};

export function CrmPage({
  title,
  description,
  newHref,
  newLabel = "New",
  total,
  children,
  filters,
}: CrmPageProps) {
  return (
    <ListPageShell>
      <section className="relative overflow-hidden rounded-[26px] border bg-card/82 p-4 shadow-[var(--shadow-md)] md:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_46%)]"
        />
        <div className="relative space-y-4">
          <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/7 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            CRM section
          </div>
          <PageHeader
            title={title}
            description={description}
            actions={
              newHref ? (
                <Link href={newHref} className={cn(buttonVariants({ size: "lg" }))}>
                  <Plus />
                  {newLabel}
                </Link>
              ) : null
            }
          />
          {total != null ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full border bg-background/70 px-3 py-1 shadow-[var(--shadow-xs)]">
                {total} records in your CRM scope
              </span>
            </div>
          ) : null}
          {filters ? (
            <form className="grid gap-2 rounded-[22px] border bg-background/72 p-3 shadow-[var(--shadow-sm)] md:grid-cols-[1fr_180px_180px_auto]">
              <Input name="q" defaultValue={filters.q} placeholder="Search CRM records" />
              {filters.statuses ? (
                <select name="status" defaultValue={filters.status ?? ""} className={nativeSelectClass}>
                  <option value="">All statuses</option>
                  {filters.statuses.map((status) => (
                    <option key={status} value={status}>
                      {labelize(status)}
                    </option>
                  ))}
                </select>
              ) : (
                <span />
              )}
              {filters.priorities ? (
                <select name="priority" defaultValue={filters.priority ?? ""} className={nativeSelectClass}>
                  <option value="">All priorities</option>
                  {filters.priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {labelize(priority)}
                    </option>
                  ))}
                </select>
              ) : (
                <span />
              )}
              <Button type="submit" variant="outline" size="lg">
                Apply
              </Button>
            </form>
          ) : null}
        </div>
      </section>
      {children}
    </ListPageShell>
  );
}

export function CrmSummary({ children }: { children: React.ReactNode }) {
  return <ListSummaryRow left={children} />;
}
