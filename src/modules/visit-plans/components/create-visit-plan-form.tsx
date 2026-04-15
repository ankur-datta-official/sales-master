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
import { cn } from "@/lib/utils";
import { createVisitPlanAction } from "@/modules/visit-plans/actions";
import {
  createVisitPlanSchema,
  type CreateVisitPlanInput,
} from "@/modules/visit-plans/schemas";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type PartyOption = { id: string; name: string };
type ProfileOption = { id: string; full_name: string | null; email: string | null };

type Props = {
  organizationId: string;
  isAdmin: boolean;
  parties: PartyOption[];
  assignableProfiles: ProfileOption[];
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateVisitPlanForm({
  organizationId,
  isAdmin,
  parties,
  assignableProfiles,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateVisitPlanInput>({
    resolver: zodResolver(createVisitPlanSchema),
    defaultValues: {
      organization_id: organizationId,
      party_id: parties[0]?.id ?? "",
      visit_date: todayIsoDate(),
      purpose: "",
      assignee_user_id: undefined,
    },
  });

  function onSubmit(values: CreateVisitPlanInput) {
    setError(null);
    startTransition(async () => {
      const result = await createVisitPlanAction({
        ...values,
        organization_id: organizationId,
        purpose: values.purpose.trim(),
        assignee_user_id: isAdmin ? values.assignee_user_id : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.visitPlans}/${result.data!.visitPlanId}`);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New visit plan</CardTitle>
        <CardDescription>Schedule a customer visit as planned.</CardDescription>
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
              {parties.length === 0 ? (
                <option value="">No parties available</option>
              ) : (
                parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="assignee_user_id">Assign to</Label>
              <select
                id="assignee_user_id"
                className={selectClass}
                {...form.register("assignee_user_id", {
                  setValueAs: (v) => (v === "" ? undefined : v),
                })}
                disabled={assignableProfiles.length === 0}
              >
                <option value="">Select user</option>
                {assignableProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email ?? p.id}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="visit_date">Visit date</Label>
            <Input id="visit_date" type="date" {...form.register("visit_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea id="purpose" rows={4} {...form.register("purpose")} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || parties.length === 0}>
            {isPending ? "Creating..." : "Create visit plan"}
          </Button>
          <Link
            href={ROUTES.visitPlans}
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
