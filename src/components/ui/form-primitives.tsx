import * as React from "react";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FormShell({
  title,
  description,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-card/75 shadow-[var(--shadow-md)]",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent"
      />
      {(title || description) && (
        <CardHeader className="relative pb-4">
          <div className="space-y-1">
            {title ? (
              <div className="font-heading text-base font-semibold tracking-tight">
                {title}
              </div>
            ) : null}
            {description ? (
              <div className="max-w-[80ch] text-sm leading-relaxed text-muted-foreground">
                {description}
              </div>
            ) : null}
          </div>
        </CardHeader>
      )}
      {children}
    </Card>
  );
}

export function FormContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent
      className={cn(
        "relative space-y-6",
        "data-[density=compact]:space-y-4",
        className
      )}
      {...props}
    />
  );
}

export function FormSection({
  title,
  description,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section
      data-slot="form-section"
      className={cn(
        "space-y-4 rounded-2xl border bg-background/40 p-4 shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title ? (
            <div className="text-sm font-semibold tracking-tight">{title}</div>
          ) : null}
          {description ? (
            <div className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2.5", className)} data-slot="form-field">
      <div className="flex flex-col gap-1">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none tracking-tight"
        >
          {label}
        </label>
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div>{children}</div>
      {error ? (
        <p className="text-xs font-medium leading-relaxed text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormActions({
  sticky = false,
  className,
  children,
  ...props
}: React.ComponentProps<typeof CardFooter> & { sticky?: boolean }) {
  return (
    <CardFooter
      data-slot="form-actions"
      data-sticky={sticky}
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        "border-t bg-background/60 py-3",
        sticky &&
          "sticky bottom-0 z-10 shadow-[0_-10px_30px_hsl(0_0%_0%/0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/55",
        className
      )}
      {...props}
    >
      {children}
    </CardFooter>
  );
}

