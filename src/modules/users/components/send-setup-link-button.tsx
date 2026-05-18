"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { sendUserSetupLinkAction } from "@/modules/auth/actions";

export function SendSetupLinkButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setFeedback(null);
          startTransition(async () => {
            const result = await sendUserSetupLinkAction({ userId });
            setFeedback(result.ok ? "Setup link sent." : result.error);
            if (result.ok) {
              router.refresh();
            }
          });
        }}
      >
        {isPending ? "Sending..." : "Send setup link"}
      </Button>
      {feedback ? (
        <p className="text-xs text-muted-foreground" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
