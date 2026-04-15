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
import { updateCollectionEntryAction } from "@/modules/collection-entries/actions";
import {
  updateCollectionEntrySchema,
  type UpdateCollectionEntryInput,
} from "@/modules/collection-entries/schemas";
import type { CollectionEntryWithRelations } from "@/modules/collection-entries/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type PartyOption = { id: string; name: string };

type Props = {
  collectionEntry: CollectionEntryWithRelations;
  parties: PartyOption[];
};

export function EditCollectionEntryForm({ collectionEntry, parties }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const partyRows = parties.some((p) => p.id === collectionEntry.party_id)
    ? parties
    : [
        { id: collectionEntry.party_id, name: collectionEntry.party_name ?? collectionEntry.party_id },
        ...parties,
      ];

  const form = useForm<UpdateCollectionEntryInput>({
    resolver: zodResolver(updateCollectionEntrySchema),
    defaultValues: {
      collectionEntryId: collectionEntry.id,
      party_id: collectionEntry.party_id,
      entry_date: collectionEntry.entry_date,
      amount: collectionEntry.amount,
      remarks: collectionEntry.remarks,
    },
  });

  function onSubmit(values: UpdateCollectionEntryInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateCollectionEntryAction({
        ...values,
        collectionEntryId: collectionEntry.id,
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
        <CardTitle>Edit collection entry</CardTitle>
        <CardDescription>
          Owners may edit unverified rows within 72 hours of creation; admins may edit anytime.
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
            <Label htmlFor="party_id">Party</Label>
            <select id="party_id" className={selectClass} {...form.register("party_id")}>
              {partyRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry_date">Entry date</Label>
            <Input id="entry_date" type="date" {...form.register("entry_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" rows={3} {...form.register("remarks")} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Link
            href={ROUTES.collectionEntries}
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
