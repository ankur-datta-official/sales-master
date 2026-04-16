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
import { FormErrorAlert } from "@/components/ui/form-error-alert";
import {
  FormActions,
  FormContent,
  FormField,
  FormShell,
  FormSection,
} from "@/components/ui/form-primitives";
import { NativeSelect } from "@/components/ui/native-select";
import { ROUTES } from "@/config/routes";
import { WORK_PLAN_PRIORITIES } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { createWorkPlanAction } from "@/modules/work-plans/actions";
import {
  createWorkPlanSchema,
  type CreateWorkPlanInput,
} from "@/modules/work-plans/schemas";

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
    <FormShell
      className="max-w-2xl"
      title="New work plan"
      description="Create your plan as draft and submit when ready."
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <FormErrorAlert message={error} />

          <FormSection title="Plan details" description="Keep it clear and actionable.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Plan date"
                htmlFor="plan_date"
                error={form.formState.errors.plan_date?.message}
              >
                <Input
                  id="plan_date"
                  type="date"
                  {...form.register("plan_date")}
                />
              </FormField>

              <FormField
                label="Priority"
                htmlFor="priority"
                description="Optional."
              >
                <NativeSelect
                  id="priority"
                  {...form.register("priority", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                >
                  <option value="">— None —</option>
                  {WORK_PLAN_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </div>

            <FormField
              label="Title"
              htmlFor="title"
              description="A short summary for quick scanning."
              error={form.formState.errors.title?.message}
            >
              <Input id="title" {...form.register("title")} />
            </FormField>

            <FormField
              label="Details"
              htmlFor="details"
              description="Add key actions, parties, and expected outcomes."
              error={form.formState.errors.details?.message}
            >
              <Textarea id="details" rows={6} {...form.register("details")} />
            </FormField>
          </FormSection>
        </FormContent>

        <FormActions sticky>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </FormActions>
      </form>
    </FormShell>
  );
}
