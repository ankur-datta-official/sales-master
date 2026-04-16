import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = React.ComponentProps<"div"> & {
  variant?: "page" | "card" | "table";
};

export function LoadingSkeleton({
  variant = "page",
  className,
  ...props
}: LoadingSkeletonProps) {
  if (variant === "table") {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        <Skeleton className="h-8 w-64" />
        <div className="rounded-xl border bg-card shadow-[var(--shadow-xs)]">
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[95%]" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("rounded-xl border bg-card p-4 shadow-[var(--shadow-xs)]", className)} {...props}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
        <Skeleton className="mt-4 h-9 w-28" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}

