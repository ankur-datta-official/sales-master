import { Suspense } from "react";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[28rem] space-y-5">
          <Skeleton className="h-9 w-28 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-10 w-52 rounded-2xl" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-card/85 p-6 shadow-[0_24px_60px_hsl(220_40%_12%_/_0.10)]">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="mt-5 h-12 w-full rounded-2xl" />
            <Skeleton className="mt-5 h-4 w-24 rounded-full" />
            <Skeleton className="mt-3 h-12 w-full rounded-2xl" />
            <Skeleton className="mt-5 h-16 w-full rounded-[1.35rem]" />
            <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
