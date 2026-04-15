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
import { cn } from "@/lib/utils";
import {
  approveDemandOrderAction,
  forwardDemandOrderAction,
  rejectDemandOrderAction,
} from "@/modules/demand-orders/approval-actions";
import type { DemandOrderStatus } from "@/constants/statuses";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type ForwardTarget = { id: string; full_name: string | null; email: string | null };

type Props = {
  demandOrderId: string;
  status: DemandOrderStatus;
  forwardTargets: ForwardTarget[];
};

export function ReviewDemandOrderPanel({ demandOrderId, status, forwardTargets }: Props) {
  const router = useRouter();
  const [approveNote, setApproveNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [forwardTo, setForwardTo] = useState(forwardTargets[0]?.id ?? "");
  const [forwardNote, setForwardNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDecide = status === "submitted" || status === "under_review";
  const canForward = status === "submitted" && forwardTargets.length > 0;

  return (
    <Card className="max-w-4xl border-teal-500/25">
      <CardHeader>
        <CardTitle className="text-base">Review</CardTitle>
        <CardDescription>
          Approve or reject submitted demand orders in your hierarchy scope. Forward sends the order
          to under review for another reviewer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {canDecide && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="approve-note">Approve (optional note)</Label>
              <Textarea
                id="approve-note"
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
                    const result = await approveDemandOrderAction({
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
                {isPending ? "Working…" : "Approve"}
              </Button>
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="reject-note">Reject (optional note)</Label>
              <Textarea
                id="reject-note"
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
                    const result = await rejectDemandOrderAction({
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
        )}

        {canForward && (
          <div className="space-y-2 rounded-md border p-3">
            <Label htmlFor="forward-to">Forward to reviewer</Label>
            <select
              id="forward-to"
              className={selectClass}
              value={forwardTo}
              onChange={(e) => setForwardTo(e.target.value)}
            >
              <option value="" disabled>
                Select reviewer
              </option>
              {forwardTargets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email ?? p.id}
                </option>
              ))}
            </select>
            <Label htmlFor="forward-note">Note (optional)</Label>
            <Textarea
              id="forward-note"
              rows={2}
              value={forwardNote}
              onChange={(e) => setForwardNote(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !forwardTo}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await forwardDemandOrderAction({
                    demandOrderId,
                    to_user_id: forwardTo,
                    note: forwardNote.trim() || undefined,
                  });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setForwardNote("");
                  router.refresh();
                })
              }
            >
              {isPending ? "Working…" : "Forward for review"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
