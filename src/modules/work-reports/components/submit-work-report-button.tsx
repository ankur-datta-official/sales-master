"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { submitWorkReportAction } from "@/modules/work-reports/actions";

type Props = { workReportId: string };

export function SubmitWorkReportButton({ workReportId }: Props) {
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
            const result = await submitWorkReportAction({ workReportId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {isPending ? "Submitting..." : "Submit report"}
      </Button>
    </div>
  );
}
