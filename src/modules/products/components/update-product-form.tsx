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
import { PRODUCT_STATUSES } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { updateProductAction } from "@/modules/products/actions";
import { updateProductSchema, type UpdateProductInput } from "@/modules/products/schemas";
import type { Product } from "@/modules/products/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type Props = { product: Product };

export function UpdateProductForm({ product }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      productId: product.id,
      product_name: product.product_name,
      item_code: product.item_code,
      unit: product.unit,
      base_price: product.base_price,
      category: product.category,
      description: product.description,
      status: product.status,
    },
  });

  function onSubmit(values: UpdateProductInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateProductAction({
        ...values,
        productId: product.id,
        product_name: values.product_name.trim(),
        item_code: values.item_code.trim(),
        unit: values.unit.trim(),
        category: values.category?.trim() || null,
        description: values.description?.trim() || null,
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
        <CardTitle>Edit product</CardTitle>
        <CardDescription>Update product details and status.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="product_name">Product name</Label>
            <Input id="product_name" {...form.register("product_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item_code">Item code</Label>
            <Input id="item_code" {...form.register("item_code")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" {...form.register("unit")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base_price">Base price</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              min="0"
              {...form.register("base_price", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input id="category" {...form.register("category")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={4} {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...form.register("status")}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Link
            href={ROUTES.products}
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
