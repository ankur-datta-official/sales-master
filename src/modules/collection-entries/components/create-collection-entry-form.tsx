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
import { createCollectionEntryAction } from "@/modules/collection-entries/actions";
import {
  createCollectionEntrySchema,
  type CreateCollectionEntryInput,
} from "@/modules/collection-entries/schemas";

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

export function CreateCollectionEntryForm({
  organizationId,
  isAdmin,
  parties,
  assignableProfiles,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCollectionEntryInput>({
    resolver: zodResolver(createCollectionEntrySchema),
    defaultValues: {
      organization_id: organizationId,
      party_id: parties[0]?.id ?? "",
      assignee_user_id: undefined,
      entry_date: todayIsoDate(),
      amount: 1,
      remarks: "",
    },
  });

  function onSubmit(values: CreateCollectionEntryInput) {
    setError(null);
    startTransition(async () => {
      const result = await createCollectionEntryAction({
        ...values,
        organization_id: organizationId,
        remarks: values.remarks?.trim() ?? "",
        assignee_user_id: isAdmin ? values.assignee_user_id : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.collectionEntries}/${result.data!.collectionEntryId}`);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New collection entry</CardTitle>
        <CardDescription>Record a collection against a party (starts unverified).</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="assignee_user_id">Collector (user)</Label>
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
          <Button type="submit" disabled={isPending || parties.length === 0}>
            {isPending ? "Saving..." : "Create entry"}
          </Button>
          <Link
            href={ROUTES.collectionEntries}
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
