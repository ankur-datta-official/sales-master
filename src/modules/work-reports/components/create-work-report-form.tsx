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
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { createWorkReportAction } from "@/modules/work-reports/actions";
import {
  createWorkReportSchema,
  type CreateWorkReportInput,
} from "@/modules/work-reports/schemas";

type Props = { organizationId: string };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateWorkReportForm({ organizationId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateWorkReportInput>({
    resolver: zodResolver(createWorkReportSchema),
    defaultValues: {
      organization_id: organizationId,
      report_date: todayIsoDate(),
      summary: "",
      achievements: "",
      challenges: "",
      next_step: "",
      status: "draft",
    },
  });

  function onSubmit(values: CreateWorkReportInput) {
    setError(null);
    startTransition(async () => {
      const result = await createWorkReportAction({
        ...values,
        organization_id: organizationId,
        summary: values.summary.trim(),
        achievements: values.achievements?.trim() || null,
        challenges: values.challenges?.trim() || null,
        next_step: values.next_step?.trim() || null,
        status: "draft",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.workReports}/${result.data!.workReportId}`);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New work report</CardTitle>
        <CardDescription>Create your daily report as draft, then submit.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <FormErrorAlert message={error} />
          <div className="space-y-2">
            <Label htmlFor="report_date">Report date</Label>
            <Input id="report_date" type="date" {...form.register("report_date")} />
            {form.formState.errors.report_date ? (
              <p className="text-xs text-destructive">{form.formState.errors.report_date.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" rows={4} {...form.register("summary")} />
            {form.formState.errors.summary ? (
              <p className="text-xs text-destructive">{form.formState.errors.summary.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="achievements">Achievements</Label>
            <Textarea id="achievements" rows={4} {...form.register("achievements")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="challenges">Challenges</Label>
            <Textarea id="challenges" rows={4} {...form.register("challenges")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_step">Next step</Label>
            <Textarea id="next_step" rows={4} {...form.register("next_step")} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create draft"}
          </Button>
          <Link
            href={ROUTES.workReports}
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
