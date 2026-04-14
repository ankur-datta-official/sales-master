"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { ROUTES } from "@/config/routes";
import { WORK_PLAN_PRIORITIES } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { createWorkPlanAction } from "@/modules/work-plans/actions";
import {
  createWorkPlanSchema,
  type CreateWorkPlanInput,
} from "@/modules/work-plans/schemas";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type Props = { organizationId: string };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateWorkPlanForm({ organizationId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateWorkPlanInput>({
    resolver: zodResolver(createWorkPlanSchema),
    defaultValues: {
      organization_id: organizationId,
      plan_date: todayIsoDate(),
      title: "",
      details: "",
      priority: null,
      status: "draft",
    },
  });

  function onSubmit(values: CreateWorkPlanInput) {
    setError(null);
    startTransition(async () => {
      const result = await createWorkPlanAction({
        ...values,
        organization_id: organizationId,
        title: values.title.trim(),
        details: values.details.trim(),
        priority: values.priority || null,
        status: "draft",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.workPlans}/${result.data!.workPlanId}`);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New work plan</CardTitle>
        <CardDescription>Create your plan as draft and submit when ready.</CardDescription>
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
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create draft"}
          </Button>
          <Link
            href={ROUTES.workPlans}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex h-9 items-center justify-center px-4"
            )}
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
