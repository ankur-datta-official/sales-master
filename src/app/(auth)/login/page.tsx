import { Suspense } from "react";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
          <div className="rounded-2xl border bg-card/75 p-5 shadow-[var(--shadow-md)]">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="mt-2 h-9 w-full rounded-xl" />
            <Skeleton className="mt-4 h-4 w-24 rounded-lg" />
            <Skeleton className="mt-2 h-9 w-full rounded-xl" />
            <Skeleton className="mt-5 h-9 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
