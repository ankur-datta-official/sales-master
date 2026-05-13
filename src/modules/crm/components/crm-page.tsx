import Link from "next/link";
import { Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPageHeader, ListPageShell, ListSummaryRow } from "@/components/ui/list-page";
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
      <ListPageHeader
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
        meta={total != null ? `${total} records in your CRM scope` : undefined}
      />
      {filters ? (
        <form className="grid gap-2 rounded-2xl border bg-card/70 p-3 shadow-[var(--shadow-sm)] md:grid-cols-[1fr_180px_180px_auto]">
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
      {children}
    </ListPageShell>
  );
}

export function CrmSummary({ children }: { children: React.ReactNode }) {
  return <ListSummaryRow left={children} />;
}
