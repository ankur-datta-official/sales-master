"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateVisitPlanStatusAction } from "@/modules/visit-plans/actions";
import {
  updateVisitPlanStatusSchema,
  type UpdateVisitPlanStatusInput,
} from "@/modules/visit-plans/schemas";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type Props = { visitPlanId: string };

export function UpdateVisitPlanStatusForm({ visitPlanId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateVisitPlanStatusInput>({
    resolver: zodResolver(updateVisitPlanStatusSchema),
    defaultValues: {
      visitPlanId,
      status: "completed",
    },
  });

  function onSubmit(values: UpdateVisitPlanStatusInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateVisitPlanStatusAction({
        visitPlanId,
        status: values.status,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Update status</CardTitle>
        <CardDescription>Mark this visit as completed, skipped, or cancelled.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="status">Outcome</Label>
            <select id="status" className={selectClass} {...form.register("status")}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update status"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
