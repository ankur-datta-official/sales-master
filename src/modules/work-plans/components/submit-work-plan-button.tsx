"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { submitWorkPlanAction } from "@/modules/work-plans/actions";

type Props = { workPlanId: string };

export function SubmitWorkPlanButton({ workPlanId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await submitWorkPlanAction({ workPlanId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {isPending ? "Submitting..." : "Submit plan"}
      </Button>
    </div>
  );
}
