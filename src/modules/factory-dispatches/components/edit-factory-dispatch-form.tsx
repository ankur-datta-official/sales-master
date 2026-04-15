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
import { FACTORY_DISPATCH_STATUSES } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { updateFactoryDispatchAction } from "@/modules/factory-dispatches/actions";
import {
  updateFactoryDispatchSchema,
  type UpdateFactoryDispatchInput,
} from "@/modules/factory-dispatches/schemas";
import type { FactoryDispatchDetail } from "@/modules/factory-dispatches/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type Props = {
  dispatch: FactoryDispatchDetail;
};

export function EditFactoryDispatchForm({ dispatch }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateFactoryDispatchInput>({
    resolver: zodResolver(updateFactoryDispatchSchema),
    defaultValues: {
      dispatchId: dispatch.id,
      factory_status: dispatch.factory_status,
      challan_no: dispatch.challan_no ?? "",
      memo_no: dispatch.memo_no ?? "",
      dispatch_date: dispatch.dispatch_date ?? "",
      remarks: dispatch.remarks ?? "",
    },
  });

  function onSubmit(values: UpdateFactoryDispatchInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateFactoryDispatchAction({
        ...values,
        dispatchId: dispatch.id,
        remarks: values.remarks?.trim() ?? "",
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
        <CardTitle>Dispatch details</CardTitle>
        <CardDescription>
          Update factory status, challan, memo, and dispatch date. Changes are saved to this dispatch
          record only.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="factory_status">Factory status</Label>
            <select
              id="factory_status"
              className={selectClass}
              {...form.register("factory_status")}
            >
              {FACTORY_DISPATCH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {form.formState.errors.factory_status ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.factory_status.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="challan_no">Challan no.</Label>
              <Input id="challan_no" {...form.register("challan_no")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memo_no">Memo no.</Label>
              <Input id="memo_no" {...form.register("memo_no")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dispatch_date">Dispatch date</Label>
            <Input id="dispatch_date" type="date" {...form.register("dispatch_date")} />
            {form.formState.errors.dispatch_date ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.dispatch_date.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" rows={3} {...form.register("remarks")} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save dispatch"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
