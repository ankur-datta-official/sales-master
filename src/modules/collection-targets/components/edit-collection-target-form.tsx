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
  COLLECTION_TARGET_PERIOD_TYPES,
  COLLECTION_TARGET_STATUSES,
} from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { updateCollectionTargetAction } from "@/modules/collection-targets/actions";
import {
  updateCollectionTargetSchema,
  type UpdateCollectionTargetInput,
} from "@/modules/collection-targets/schemas";
import type { CollectionTargetWithRelations } from "@/modules/collection-targets/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type PartyOption = { id: string; name: string };
type ProfileOption = { id: string; full_name: string | null; email: string | null };

type Props = {
  collectionTarget: CollectionTargetWithRelations;
  assignableProfiles: ProfileOption[];
  parties: PartyOption[];
};

export function EditCollectionTargetForm({
  collectionTarget,
  assignableProfiles,
  parties,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const partyRows = parties.some((p) => p.id === collectionTarget.party_id)
    ? parties
    : collectionTarget.party_id
      ? [
          {
            id: collectionTarget.party_id,
            name: collectionTarget.party_name ?? collectionTarget.party_id,
          },
          ...parties,
        ]
      : parties;

  const profileRows = assignableProfiles.some(
    (p) => p.id === collectionTarget.assigned_to_user_id
  )
    ? assignableProfiles
    : [
        {
          id: collectionTarget.assigned_to_user_id,
          full_name: collectionTarget.assignee_name,
          email: collectionTarget.assignee_email,
        },
        ...assignableProfiles,
      ];

  const form = useForm<UpdateCollectionTargetInput>({
    resolver: zodResolver(updateCollectionTargetSchema),
    defaultValues: {
      collectionTargetId: collectionTarget.id,
      assigned_to_user_id: collectionTarget.assigned_to_user_id,
      party_id: collectionTarget.party_id ?? "",
      period_type: collectionTarget.period_type,
      start_date: collectionTarget.start_date,
      end_date: collectionTarget.end_date,
      target_amount: collectionTarget.target_amount,
      status: collectionTarget.status,
    },
  });

  function onSubmit(values: UpdateCollectionTargetInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateCollectionTargetAction({
        ...values,
        collectionTargetId: collectionTarget.id,
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
        <CardTitle>Edit collection target</CardTitle>
        <CardDescription>Changes must stay within your assignment permissions.</CardDescription>
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
              disabled={profileRows.length === 0}
            >
              {profileRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email ?? p.id}
                </option>
              ))}
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
              {partyRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_type">Period type</Label>
            <select id="period_type" className={selectClass} {...form.register("period_type")}>
              {COLLECTION_TARGET_PERIOD_TYPES.map((p) => (
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
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...form.register("status")}>
              {COLLECTION_TARGET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || profileRows.length === 0}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Link
            href={ROUTES.collectionTargets}
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
