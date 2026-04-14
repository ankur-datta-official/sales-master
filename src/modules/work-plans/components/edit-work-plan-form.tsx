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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WORK_PLAN_PRIORITIES } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { updateDraftWorkPlanAction } from "@/modules/work-plans/actions";
import {
  updateDraftWorkPlanSchema,
  type UpdateDraftWorkPlanInput,
} from "@/modules/work-plans/schemas";
import type { WorkPlanWithPeople } from "@/modules/work-plans/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type Props = {
  workPlan: WorkPlanWithPeople;
};

export function EditWorkPlanForm({ workPlan }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateDraftWorkPlanInput>({
    resolver: zodResolver(updateDraftWorkPlanSchema),
    defaultValues: {
      workPlanId: workPlan.id,
      plan_date: workPlan.plan_date,
      title: workPlan.title,
      details: workPlan.details,
      priority: workPlan.priority,
    },
  });

  function onSubmit(values: UpdateDraftWorkPlanInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateDraftWorkPlanAction({
        ...values,
        workPlanId: workPlan.id,
        title: values.title.trim(),
        details: values.details.trim(),
        priority: values.priority || null,
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
        <CardTitle>Edit draft</CardTitle>
        <CardDescription>Only draft plans can be updated.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="plan_date">Plan date</Label>
            <Input id="plan_date" type="date" {...form.register("plan_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea id="details" rows={6} {...form.register("details")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (optional)</Label>
            <select
              id="priority"
              className={selectClass}
              {...form.register("priority", { setValueAs: (v) => (v === "" ? null : v) })}
            >
              <option value="">— None —</option>
              {WORK_PLAN_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save draft"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
