"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";

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
import { createDemandOrderAction } from "@/modules/demand-orders/actions";
import {
  createDemandOrderSchema,
  type CreateDemandOrderInput,
} from "@/modules/demand-orders/schemas";

type PartyOption = { id: string; name: string };
type ProfileOption = { id: string; full_name: string | null; email: string | null };
type ProductOption = { id: string; product_name: string; base_price: number };

type Props = {
  organizationId: string;
  isAdmin: boolean;
  parties: PartyOption[];
  assignableProfiles: ProfileOption[];
  products: ProductOption[];
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultLine(products: ProductOption[]): CreateDemandOrderInput["items"][number] {
  const p = products[0];
  return {
    product_id: p?.id ?? "",
    quantity: 1,
    unit_price: p?.base_price ?? 0,
    remark: "",
  };
}

export function CreateDemandOrderForm({
  organizationId,
  isAdmin,
  parties,
  assignableProfiles,
  products,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateDemandOrderInput>({
    resolver: zodResolver(createDemandOrderSchema),
    defaultValues: {
      organization_id: organizationId,
      party_id: parties[0]?.id ?? "",
      assignee_user_id: undefined,
      order_date: todayIsoDate(),
      remarks: "",
      items: products.length ? [defaultLine(products)] : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { register, handleSubmit, setValue } = form;

  function onSubmit(values: CreateDemandOrderInput) {
    setError(null);
    startTransition(async () => {
      const result = await createDemandOrderAction({
        ...values,
        organization_id: organizationId,
        remarks: values.remarks?.trim() ?? "",
        assignee_user_id: isAdmin ? values.assignee_user_id : undefined,
        items: values.items.map((i) => ({
          ...i,
          remark: i.remark?.trim() ?? "",
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.demandOrders}/${result.data!.demandOrderId}`);
      router.refresh();
    });
  }

  const canSave = parties.length > 0 && products.length > 0 && fields.length > 0;

  return (
    <FormShell
      className="max-w-4xl"
      title="New demand order"
      description="Draft order with one or more products. Total updates from line totals."
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormContent>
          <FormErrorAlert message={error} />
          <FormSection title="Order details" description="Set ownership, party, and the order date.">
            <div className="grid gap-5 sm:grid-cols-2">
              {isAdmin ? (
                <FormField
                  label="Order owner (user)"
                  htmlFor="assignee_user_id"
                  description="Admins can create drafts for other users."
                >
                  <NativeSelect
                    id="assignee_user_id"
                    {...register("assignee_user_id", {
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

              <FormField
                label="Party"
                htmlFor="party_id"
                error={form.formState.errors.party_id?.message}
              >
                <NativeSelect
                  id="party_id"
                  {...register("party_id")}
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

              <FormField
                label="Order date"
                htmlFor="order_date"
                error={form.formState.errors.order_date?.message}
              >
                <Input id="order_date" type="date" {...register("order_date")} />
              </FormField>

              <FormField label="Remarks" htmlFor="remarks" description="Optional.">
                <Textarea id="remarks" rows={2} {...register("remarks")} />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="Line items"
            description="Add one or more products. Unit price defaults from product base price."
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {fields.length === 1 ? "1 line" : `${fields.length} lines`}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={products.length === 0}
                onClick={() => append(defaultLine(products))}
              >
                Add line
              </Button>
            </div>

            <div className="space-y-3 rounded-2xl border bg-card/50 p-3 shadow-[var(--shadow-xs)]">
              {form.formState.errors.items?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.items.message}
                </p>
              ) : null}
              {fields.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Add at least one product line.
                </p>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 border-b pb-3 last:border-0 last:pb-0 sm:grid-cols-12 sm:items-end"
                  >
                    <div className="sm:col-span-4">
                      <FormField label="Product" description={undefined} htmlFor={`items.${index}.product_id`}>
                        <NativeSelect
                          {...(() => {
                            const r = register(`items.${index}.product_id`);
                            return {
                              name: r.name,
                              ref: r.ref,
                              onBlur: r.onBlur,
                              onChange: (e: ChangeEvent<HTMLSelectElement>) => {
                                r.onChange(e);
                                const pr = products.find((x) => x.id === e.target.value);
                                setValue(`items.${index}.unit_price`, pr?.base_price ?? 0);
                              },
                            };
                          })()}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_name}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormField>
                    </div>
                    <div className="sm:col-span-2">
                      <FormField label="Qty" htmlFor={`items.${index}.quantity`}>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-2">
                      <FormField label="Unit price" htmlFor={`items.${index}.unit_price`}>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-3">
                      <FormField label="Line remark" htmlFor={`items.${index}.remark`} description="Optional.">
                        <Input {...register(`items.${index}.remark`)} />
                      </FormField>
                    </div>
                    <div className="sm:col-span-1 flex sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive shadow-none"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </FormSection>
        </FormContent>

        <FormActions sticky>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isPending || !canSave}>
              {isPending ? "Saving..." : "Create draft"}
            </Button>
            <Link
              href={ROUTES.demandOrders}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex h-9 items-center justify-center px-4"
              )}
            >
              Cancel
            </Link>
          </div>
          <div className="hidden text-xs text-muted-foreground md:block">
            Drafts can be edited until submitted.
          </div>
        </FormActions>
      </form>
    </FormShell>
  );
}
