"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/ui/form-error-alert";
import {
  FormActions,
  FormContent,
  FormField,
  FormSection,
  FormShell,
} from "@/components/ui/form-primitives";
import { NativeSelect } from "@/components/ui/native-select";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { createSalesEntryAction } from "@/modules/sales-entries/actions";
import {
  createSalesEntrySchema,
  type CreateSalesEntryInput,
} from "@/modules/sales-entries/schemas";

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

export function CreateSalesEntryForm({
  organizationId,
  isAdmin,
  parties,
  assignableProfiles,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateSalesEntryInput>({
    resolver: zodResolver(createSalesEntrySchema),
    defaultValues: {
      organization_id: organizationId,
      party_id: parties[0]?.id ?? "",
      assignee_user_id: undefined,
      entry_date: todayIsoDate(),
      amount: 1,
      quantity: 0,
      remarks: "",
      source: "manual",
    },
  });

  function onSubmit(values: CreateSalesEntryInput) {
    setError(null);
    startTransition(async () => {
      const result = await createSalesEntryAction({
        ...values,
        organization_id: organizationId,
        remarks: values.remarks?.trim() ?? "",
        assignee_user_id: isAdmin ? values.assignee_user_id : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.salesEntries}/${result.data!.salesEntryId}`);
      router.refresh();
    });
  }

  return (
    <FormShell
      className="max-w-2xl"
      title="New sales entry"
      description="Manual sale against a party (v1)."
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <FormErrorAlert message={error} />

          <FormSection title="Entry details" description="Record a single sales entry for a party.">
            <div className="grid gap-5 sm:grid-cols-2">
              {isAdmin ? (
                <FormField label="Seller (user)" htmlFor="assignee_user_id">
                  <NativeSelect
                    id="assignee_user_id"
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
                  </NativeSelect>
                </FormField>
              ) : null}

              <FormField label="Party" htmlFor="party_id">
                <NativeSelect
                  id="party_id"
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
                </NativeSelect>
              </FormField>

              <FormField label="Entry date" htmlFor="entry_date">
                <Input id="entry_date" type="date" {...form.register("entry_date")} />
              </FormField>

              <FormField label="Amount" htmlFor="amount">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...form.register("amount", { valueAsNumber: true })}
                />
              </FormField>

              <FormField label="Quantity" htmlFor="quantity" description="Optional in v1 if not tracked precisely.">
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  min="0"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
              </FormField>

              <FormField label="Remarks" htmlFor="remarks" description="Optional.">
                <Textarea id="remarks" rows={3} {...form.register("remarks")} />
              </FormField>
            </div>
          </FormSection>
        </FormContent>

        <FormActions sticky>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isPending || parties.length === 0}>
              {isPending ? "Saving..." : "Create entry"}
            </Button>
            <Link
              href={ROUTES.salesEntries}
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
