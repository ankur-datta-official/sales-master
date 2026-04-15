"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  accountsApproveDemandOrderAction,
  accountsRejectDemandOrderAction,
} from "@/modules/demand-orders/accounts-actions";

type Props = { demandOrderId: string };

export function AccountsReviewDemandOrderPanel({ demandOrderId }: Props) {
  const router = useRouter();
  const [approveNote, setApproveNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="max-w-4xl border-sky-500/25">
      <CardHeader>
        <CardTitle className="text-base">Accounts review</CardTitle>
        <CardDescription>
          Release manager-approved orders to factory or reject with a note. Factory execution is not
          part of v1.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-md border p-3">
            <Label htmlFor="acc-approve-note">Send to factory (optional note)</Label>
            <Textarea
              id="acc-approve-note"
              rows={2}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
            />
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await accountsApproveDemandOrderAction({
                    demandOrderId,
                    note: approveNote.trim() || undefined,
                  });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setApproveNote("");
                  router.refresh();
                })
              }
            >
              {isPending ? "Working…" : "Approve (send to factory)"}
            </Button>
          </div>
          <div className="space-y-2 rounded-md border p-3">
            <Label htmlFor="acc-reject-note">Reject (optional note)</Label>
            <Textarea
              id="acc-reject-note"
              rows={2}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await accountsRejectDemandOrderAction({
                    demandOrderId,
                    note: rejectNote.trim() || undefined,
                  });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setRejectNote("");
                  router.refresh();
                })
              }
            >
              {isPending ? "Working…" : "Reject"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
