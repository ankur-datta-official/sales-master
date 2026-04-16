"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <EmptyState
      title="Something went wrong"
      description="We could not load this page right now. Please try again."
      action={
        <Button type="button" onClick={reset}>
          Retry
        </Button>
      }
    />
  );
}
