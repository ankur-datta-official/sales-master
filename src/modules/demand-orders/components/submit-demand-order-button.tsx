"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { submitDemandOrderAction } from "@/modules/demand-orders/actions";

type Props = { demandOrderId: string };

export function SubmitDemandOrderButton({ demandOrderId }: Props) {
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
            const result = await submitDemandOrderAction({ demandOrderId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {isPending ? "Submitting..." : "Submit order"}
      </Button>
    </div>
  );
}
