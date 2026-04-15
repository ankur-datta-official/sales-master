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
import { cn } from "@/lib/utils";
import { updatePlannedVisitPlanAction } from "@/modules/visit-plans/actions";
import {
  updatePlannedVisitPlanSchema,
  type UpdatePlannedVisitPlanInput,
} from "@/modules/visit-plans/schemas";
import type { VisitPlanWithRelations } from "@/modules/visit-plans/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type PartyOption = { id: string; name: string };

type Props = {
  visitPlan: VisitPlanWithRelations;
  parties: PartyOption[];
};

export function EditVisitPlanForm({ visitPlan, parties }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdatePlannedVisitPlanInput>({
    resolver: zodResolver(updatePlannedVisitPlanSchema),
    defaultValues: {
      visitPlanId: visitPlan.id,
      party_id: visitPlan.party_id,
      visit_date: visitPlan.visit_date,
      purpose: visitPlan.purpose,
    },
  });

  function onSubmit(values: UpdatePlannedVisitPlanInput) {
    setError(null);
    startTransition(async () => {
      const result = await updatePlannedVisitPlanAction({
        ...values,
        visitPlanId: visitPlan.id,
        purpose: values.purpose.trim(),
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
        <CardTitle>Edit planned visit</CardTitle>
        <CardDescription>Party, date, and purpose can be changed while status is planned.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="party_id">Party</Label>
            <select
              id="party_id"
              className={selectClass}
              {...form.register("party_id")}
              disabled={parties.length === 0}
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visit_date">Visit date</Label>
            <Input id="visit_date" type="date" {...form.register("visit_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea id="purpose" rows={4} {...form.register("purpose")} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending || parties.length === 0}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
