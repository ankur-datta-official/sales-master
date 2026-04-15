"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";

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
import { updateDraftDemandOrderAction } from "@/modules/demand-orders/actions";
import {
  updateDraftDemandOrderSchema,
  type UpdateDraftDemandOrderInput,
} from "@/modules/demand-orders/schemas";
import type { DemandOrderDetail } from "@/modules/demand-orders/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type PartyOption = { id: string; name: string };
type ProductOption = { id: string; product_name: string; base_price: number };

type Props = {
  order: DemandOrderDetail;
  parties: PartyOption[];
  products: ProductOption[];
};

function defaultLine(products: ProductOption[]): UpdateDraftDemandOrderInput["items"][number] {
  const p = products[0];
  return {
    product_id: p?.id ?? "",
    quantity: 1,
    unit_price: p?.base_price ?? 0,
    remark: "",
  };
}

export function EditDraftDemandOrderForm({ order, parties, products }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const partyRows = parties.some((p) => p.id === order.party_id)
    ? parties
    : [{ id: order.party_id, name: order.party_name ?? order.party_id }, ...parties];

  const form = useForm<UpdateDraftDemandOrderInput>({
    resolver: zodResolver(updateDraftDemandOrderSchema),
    defaultValues: {
      demandOrderId: order.id,
      party_id: order.party_id,
      order_date: order.order_date,
      remarks: order.remarks,
      items:
        order.items.length > 0
          ? order.items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
              unit_price: i.unit_price,
              remark: i.remark,
            }))
          : products.length
            ? [defaultLine(products)]
            : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { register, handleSubmit, setValue } = form;

  function onSubmit(values: UpdateDraftDemandOrderInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateDraftDemandOrderAction({
        ...values,
        demandOrderId: order.id,
        remarks: values.remarks?.trim() ?? "",
        items: values.items.map((i) => ({
          ...i,
          remark: i.remark?.trim() ?? "",
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const canSave = partyRows.length > 0 && products.length > 0 && fields.length > 0;

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Edit draft order</CardTitle>
        <CardDescription>Changes replace all line items. Total is recalculated automatically.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="party_id">Party</Label>
            <select id="party_id" className={selectClass} {...register("party_id")}>
              {partyRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order_date">Order date</Label>
            <Input id="order_date" type="date" {...register("order_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" rows={2} {...register("remarks")} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Line items</Label>
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
            <div className="space-y-3 rounded-md border p-3">
              {fields.length === 0 ? (
                <p className="text-muted-foreground text-sm">Add at least one product line.</p>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 border-b pb-3 last:border-0 last:pb-0 sm:grid-cols-12 sm:items-end"
                  >
                    <div className="sm:col-span-4">
                      <Label className="text-xs">Product</Label>
                      <select
                        className={cn(selectClass, "mt-1")}
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
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="any"
                        min="0"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Unit price</Label>
                      <Input
                        className="mt-1"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Label className="text-xs">Line remark</Label>
                      <Input className="mt-1" {...register(`items.${index}.remark`)} />
                    </div>
                    <div className="sm:col-span-1 flex sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
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
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || !canSave}>
            {isPending ? "Saving..." : "Save draft"}
          </Button>
          <Link
            href={ROUTES.demandOrders}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex h-9 items-center justify-center px-4"
            )}
          >
            Back to list
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
