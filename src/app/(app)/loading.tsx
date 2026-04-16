import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-4 w-[22rem] rounded-lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card/60 p-4 shadow-[var(--shadow-sm)]">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="mt-3 h-8 w-28 rounded-xl" />
          <Skeleton className="mt-2 h-3 w-36 rounded-lg" />
        </div>
        <div className="rounded-2xl border bg-card/60 p-4 shadow-[var(--shadow-sm)]">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="mt-3 h-8 w-28 rounded-xl" />
          <Skeleton className="mt-2 h-3 w-36 rounded-lg" />
        </div>
        <div className="rounded-2xl border bg-card/60 p-4 shadow-[var(--shadow-sm)]">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="mt-3 h-8 w-28 rounded-xl" />
          <Skeleton className="mt-2 h-3 w-36 rounded-lg" />
        </div>
        <div className="rounded-2xl border bg-card/60 p-4 shadow-[var(--shadow-sm)]">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="mt-3 h-8 w-28 rounded-xl" />
          <Skeleton className="mt-2 h-3 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
