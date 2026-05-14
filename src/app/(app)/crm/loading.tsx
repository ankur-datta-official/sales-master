import { Skeleton } from "@/components/ui/skeleton";

export default function CrmLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border bg-card/70 p-4 shadow-[var(--shadow-sm)]"
          >
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="mt-3 h-8 w-28 rounded-xl" />
            <Skeleton className="mt-2 h-3 w-36 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border bg-card/75 p-5 shadow-[var(--shadow-md)]">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-72 rounded-lg" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
        <div className="rounded-[24px] border bg-card/75 p-5 shadow-[var(--shadow-md)]">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-52 rounded-lg" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}
