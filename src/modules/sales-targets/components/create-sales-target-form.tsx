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
import {
  FormActions,
  FormContent,
  FormField,
  FormShell,
  FormSection,
} from "@/components/ui/form-primitives";
import { FormErrorAlert } from "@/components/ui/form-error-alert";
import { NativeSelect } from "@/components/ui/native-select";
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
    <FormShell
      className="max-w-2xl"
      title="New sales target"
      description="Assign volume or value targets within your hierarchy scope."
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <FormErrorAlert message={error} />

          <FormSection title="Assignment" description="Targets follow hierarchy visibility and review.">
            <FormField label="Assign to" htmlFor="assigned_to_user_id">
              <NativeSelect
                id="assigned_to_user_id"
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
              </NativeSelect>
            </FormField>

            <FormField
              label="Party"
              htmlFor="party_id"
              description="Optional. Leave blank for organization scope."
            >
              <NativeSelect
                id="party_id"
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
              </NativeSelect>
            </FormField>
          </FormSection>

          <FormSection title="Period" description="Pick the target window.">
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField label="Period type" htmlFor="period_type">
                <NativeSelect id="period_type" {...form.register("period_type")}>
                  {SALES_TARGET_PERIOD_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>

              <FormField label="Start date" htmlFor="start_date">
                <Input id="start_date" type="date" {...form.register("start_date")} />
              </FormField>

              <FormField label="End date" htmlFor="end_date">
                <Input id="end_date" type="date" {...form.register("end_date")} />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Targets" description="Value and (optional) quantity.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Target amount" htmlFor="target_amount">
                <Input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...form.register("target_amount", { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Target quantity"
                htmlFor="target_qty"
                description="Optional."
              >
                <Input
                  id="target_qty"
                  type="number"
                  step="any"
                  min="0"
                  {...form.register("target_qty")}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Status">
            <FormField label="Status" htmlFor="status">
              <NativeSelect id="status" {...form.register("status")}>
                {SALES_TARGET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </FormSection>
        </FormContent>

        <FormActions sticky>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
          <div className="hidden text-xs text-muted-foreground md:block">
            Draft targets can be reviewed before activation.
          </div>
        </FormActions>
      </form>
    </FormShell>
  );
}
