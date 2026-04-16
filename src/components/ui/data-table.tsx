import * as React from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { TableShell } from "@/components/ui/table-shell";
import { cn } from "@/lib/utils";

export function DataTable({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TableShell>) {
  return (
    <TableShell className={cn("bg-card/80", className)} {...props}>
      {children}
    </TableShell>
  );
}

export function DataTableTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="data-table"
      className={cn("w-full text-left text-sm", className)}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  sticky = true,
  ...props
}: React.ComponentProps<"thead"> & { sticky?: boolean }) {
  return (
    <thead
      className={cn(
        "border-b border-border/70 bg-muted/25 text-xs text-muted-foreground",
        sticky &&
          "sticky top-0 z-10 shadow-[0_1px_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-muted/20",
        className
      )}
      {...props}
    />
  );
}

export function DataTableHeaderCell({
  className,
  align = "left",
  ...props
}: React.ComponentProps<"th"> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      data-align={align}
      className={cn(
        "px-4 py-3 font-semibold tracking-tight",
        "data-[align=right]:text-right data-[align=center]:text-center",
        className
      )}
      {...props}
    />
  );
}

export function DataTableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-border/70", className)} {...props} />;
}

export function DataTableRow({
  className,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "transition-[background-color] hover:bg-muted/20",
        "focus-within:bg-muted/25",
        className
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  align = "left",
  ...props
}: React.ComponentProps<"td"> & { align?: "left" | "right" | "center" }) {
  return (
    <td
      data-align={align}
      className={cn(
        "px-4 py-3 align-top",
        "data-[align=right]:text-right data-[align=center]:text-center",
        className
      )}
      {...props}
    />
  );
}

export function DataTableEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  const title = typeof children === "string" ? children : "No results found.";
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12">
        <EmptyState
          title={title}
          description={
            typeof children === "string"
              ? "Try adjusting filters, changing your search, or expanding the date range."
              : children
          }
          className="bg-background/40"
        />
      </td>
    </tr>
  );
}

