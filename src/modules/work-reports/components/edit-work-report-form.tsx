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
import { updateDraftWorkReportAction } from "@/modules/work-reports/actions";
import {
  updateDraftWorkReportSchema,
  type UpdateDraftWorkReportInput,
} from "@/modules/work-reports/schemas";
import type { WorkReportWithPeople } from "@/modules/work-reports/types";

type Props = { workReport: WorkReportWithPeople };

export function EditWorkReportForm({ workReport }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateDraftWorkReportInput>({
    resolver: zodResolver(updateDraftWorkReportSchema),
    defaultValues: {
      workReportId: workReport.id,
      report_date: workReport.report_date,
      summary: workReport.summary,
      achievements: workReport.achievements,
      challenges: workReport.challenges,
      next_step: workReport.next_step,
    },
  });

  function onSubmit(values: UpdateDraftWorkReportInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateDraftWorkReportAction({
        ...values,
        workReportId: workReport.id,
        summary: values.summary.trim(),
        achievements: values.achievements?.trim() || null,
        challenges: values.challenges?.trim() || null,
        next_step: values.next_step?.trim() || null,
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
        <CardTitle>Edit draft report</CardTitle>
        <CardDescription>Only draft reports are editable.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="report_date">Report date</Label>
            <Input id="report_date" type="date" {...form.register("report_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" rows={4} {...form.register("summary")} />
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
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save draft"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
