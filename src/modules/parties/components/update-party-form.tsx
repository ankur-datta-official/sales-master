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
import { PARTY_STATUSES } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { updatePartyAction } from "@/modules/parties/actions";
import { updatePartySchema, type UpdatePartyInput } from "@/modules/parties/schemas";
import type { PartyWithAssignee } from "@/modules/parties/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type AssigneeOption = { id: string; full_name: string | null; email: string | null };

type Props = {
  party: PartyWithAssignee;
  assignees: AssigneeOption[];
};

export function UpdatePartyForm({ party, assignees }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdatePartyInput>({
    resolver: zodResolver(updatePartySchema),
    defaultValues: {
      partyId: party.id,
      name: party.name,
      code: party.code,
      assigned_to_user_id: party.assigned_to_user_id,
      contact_person: party.contact_person,
      phone: party.phone,
      email: party.email,
      address: party.address,
      notes: party.notes,
      status: party.status,
    },
  });

  function onSubmit(values: UpdatePartyInput) {
    setError(null);
    startTransition(async () => {
      const result = await updatePartyAction({
        ...values,
        partyId: party.id,
        assigned_to_user_id: values.assigned_to_user_id || null,
        code: values.code?.trim() || null,
        contact_person: values.contact_person?.trim() || null,
        phone: values.phone?.trim() || null,
        email: values.email?.trim() || null,
        address: values.address?.trim() || null,
        notes: values.notes?.trim() || null,
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
        <CardTitle>Edit party</CardTitle>
        <CardDescription>Update assignment, status, and contact details.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Party name</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" {...form.register("code")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to_user_id">Assign to user</Label>
            <select
              id="assigned_to_user_id"
              className={selectClass}
              {...form.register("assigned_to_user_id", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            >
              <option value="">— Unassigned —</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name ?? a.email ?? a.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...form.register("status")}>
              {PARTY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact person</Label>
            <Input id="contact_person" {...form.register("contact_person")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={4} {...form.register("notes")} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Link
            href={ROUTES.parties}
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
