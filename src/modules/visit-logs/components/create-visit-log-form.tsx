"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { VISIT_LOG_STATUSES } from "@/constants/statuses";
import { cn } from "@/lib/utils";
import { createVisitLogAction } from "@/modules/visit-logs/actions";
import {
  createVisitLogSchema,
  type CreateVisitLogInput,
} from "@/modules/visit-logs/schemas";
import type { VisitPlanLinkOption } from "@/modules/visit-logs/types";

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
  linkableVisitPlans: VisitPlanLinkOption[];
};

export function CreateVisitLogForm({
  organizationId,
  isAdmin,
  parties,
  assignableProfiles,
  linkableVisitPlans,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateVisitLogInput>({
    resolver: zodResolver(createVisitLogSchema),
    defaultValues: {
      organization_id: organizationId,
      party_id: parties[0]?.id ?? "",
      assignee_user_id: undefined,
      visit_plan_id: "",
      check_in_time: "",
      check_out_time: "",
      check_in_lat: "",
      check_in_lng: "",
      check_out_lat: "",
      check_out_lng: "",
      notes: "",
      outcome: "",
      status: "completed",
    },
  });

  const partyId = useWatch({ control: form.control, name: "party_id" });
  const assigneeUserId = useWatch({ control: form.control, name: "assignee_user_id" });
  const assigneeId = isAdmin ? (assigneeUserId as string | undefined) ?? "" : "";

  const filteredPlans = useMemo(() => {
    const uid = isAdmin ? assigneeId : undefined;
    if (!partyId) return [];
    return linkableVisitPlans.filter((p) => {
      if (p.party_id !== partyId) return false;
      if (isAdmin) {
        if (!uid) return false;
        return p.user_id === uid;
      }
      return true;
    });
  }, [linkableVisitPlans, partyId, assigneeId, isAdmin]);

  function onSubmit(values: CreateVisitLogInput) {
    setError(null);
    startTransition(async () => {
      const result = await createVisitLogAction({
        ...values,
        organization_id: organizationId,
        notes: values.notes?.trim() ?? "",
        outcome: values.outcome?.trim() ?? "",
        assignee_user_id: isAdmin ? values.assignee_user_id : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.visitLogs}/${result.data!.visitLogId}`);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>New visit log</CardTitle>
        <CardDescription>Record a field visit. GPS and times are optional in v1.</CardDescription>
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
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="assignee_user_id">User (visitor)</Label>
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
            <Label htmlFor="visit_plan_id">Link visit plan (optional)</Label>
            <select
              id="visit_plan_id"
              className={selectClass}
              {...form.register("visit_plan_id", {
                setValueAs: (v) => (v === "" ? "" : v),
              })}
              disabled={filteredPlans.length === 0}
            >
              <option value="">None</option>
              {filteredPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.visit_date} — {p.purpose.slice(0, 60)}
                  {p.purpose.length > 60 ? "…" : ""}
                </option>
              ))}
            </select>
            {filteredPlans.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No matching visit plans for this party and user.
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_in_time">Check-in (optional)</Label>
              <Input id="check_in_time" type="datetime-local" {...form.register("check_in_time")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_time">Check-out (optional)</Label>
              <Input id="check_out_time" type="datetime-local" {...form.register("check_out_time")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_in_lat">Check-in latitude (optional)</Label>
              <Input id="check_in_lat" type="number" step="any" {...form.register("check_in_lat")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_in_lng">Check-in longitude (optional)</Label>
              <Input id="check_in_lng" type="number" step="any" {...form.register("check_in_lng")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_out_lat">Check-out latitude (optional)</Label>
              <Input
                id="check_out_lat"
                type="number"
                step="any"
                {...form.register("check_out_lat")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_lng">Check-out longitude (optional)</Label>
              <Input
                id="check_out_lng"
                type="number"
                step="any"
                {...form.register("check_out_lng")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Textarea id="outcome" rows={3} {...form.register("outcome")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...form.register("status")}>
              {VISIT_LOG_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || parties.length === 0}>
            {isPending ? "Saving..." : "Create visit log"}
          </Button>
          <Link
            href={ROUTES.visitLogs}
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
