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
import { ROUTES } from "@/config/routes";
import {
  SALES_TARGET_PERIOD_TYPES,
  SALES_TARGET_STATUSES,
} from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { createSalesTargetAction } from "@/modules/sales-targets/actions";
import {
  createSalesTargetSchema,
  type CreateSalesTargetInput,
} from "@/modules/sales-targets/schemas";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type PartyOption = { id: string; name: string };
type ProfileOption = { id: string; full_name: string | null; email: string | null };

type Props = {
  organizationId: string;
  assignableProfiles: ProfileOption[];
  parties: PartyOption[];
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateSalesTargetForm({
  organizationId,
  assignableProfiles,
  parties,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultAssignee = assignableProfiles[0]?.id ?? "";

  const form = useForm<CreateSalesTargetInput>({
    resolver: zodResolver(createSalesTargetSchema),
    defaultValues: {
      organization_id: organizationId,
      assigned_to_user_id: defaultAssignee,
      party_id: "",
      period_type: "weekly",
      start_date: todayIsoDate(),
      end_date: todayIsoDate(),
      target_amount: 1,
      target_qty: "",
      status: "draft",
    },
  });

  function onSubmit(values: CreateSalesTargetInput) {
    setError(null);
    startTransition(async () => {
      const result = await createSalesTargetAction({
        ...values,
        organization_id: organizationId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.salesTargets}/${result.data!.salesTargetId}`);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New sales target</CardTitle>
        <CardDescription>
          Assign volume or value targets within your hierarchy scope.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="assigned_to_user_id">Assign to</Label>
            <select
              id="assigned_to_user_id"
              className={selectClass}
              {...form.register("assigned_to_user_id")}
              disabled={assignableProfiles.length === 0}
            >
              {assignableProfiles.length === 0 ? (
                <option value="">No assignable users</option>
              ) : (
                assignableProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email ?? p.id}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="party_id">Party (optional)</Label>
            <select
              id="party_id"
              className={selectClass}
              {...form.register("party_id", {
                setValueAs: (v) => (v === "" ? "" : v),
              })}
            >
              <option value="">All / organization scope</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_type">Period type</Label>
            <select id="period_type" className={selectClass} {...form.register("period_type")}>
              {SALES_TARGET_PERIOD_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" type="date" {...form.register("start_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" type="date" {...form.register("end_date")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target_amount">Target amount</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                min="0.01"
                {...form.register("target_amount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_qty">Target quantity (optional)</Label>
              <Input
                id="target_qty"
                type="number"
                step="any"
                min="0"
                {...form.register("target_qty")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...form.register("status")}>
              {SALES_TARGET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || assignableProfiles.length === 0}>
            {isPending ? "Saving..." : "Create target"}
          </Button>
          <Link
            href={ROUTES.salesTargets}
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
