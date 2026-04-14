"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  reviewWorkPlanSchema,
  type ReviewWorkPlanInput,
} from "@/modules/work-plans/schemas";
import { reviewWorkPlanAction } from "@/modules/work-plans/actions";

type Props = {
  workPlanId: string;
};

export function ReviewWorkPlanForm({ workPlanId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ReviewWorkPlanInput>({
    resolver: zodResolver(reviewWorkPlanSchema),
    defaultValues: {
      workPlanId,
      status: "approved",
      review_note: "",
    },
  });

  function onSubmit(values: ReviewWorkPlanInput) {
    startTransition(async () => {
      setError(null);
      const result = await reviewWorkPlanAction({
        ...values,
        workPlanId,
        review_note: values.review_note?.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-lg border p-4">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="status">Review decision</Label>
        <select
          id="status"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          {...form.register("status")}
        >
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="review_note">Review note</Label>
        <Textarea id="review_note" rows={4} {...form.register("review_note")} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving review..." : "Submit review"}
      </Button>
    </form>
  );
}
