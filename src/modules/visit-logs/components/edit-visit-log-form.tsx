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
import { updateVisitLogAction } from "@/modules/visit-logs/actions";
import {
  updateVisitLogSchema,
  type UpdateVisitLogInput,
} from "@/modules/visit-logs/schemas";
import type { VisitLogWithRelations, VisitPlanLinkOption } from "@/modules/visit-logs/types";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type PartyOption = { id: string; name: string };

type Props = {
  visitLog: VisitLogWithRelations;
  parties: PartyOption[];
  linkableVisitPlans: VisitPlanLinkOption[];
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function coordToInput(n: number | null): string {
  if (n === null || n === undefined) return "";
  return String(n);
}

export function EditVisitLogForm({ visitLog, parties, linkableVisitPlans }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateVisitLogInput>({
    resolver: zodResolver(updateVisitLogSchema),
    defaultValues: {
      visitLogId: visitLog.id,
      party_id: visitLog.party_id,
      visit_plan_id: visitLog.visit_plan_id ?? "",
      check_in_time: toDatetimeLocalValue(visitLog.check_in_time),
      check_out_time: toDatetimeLocalValue(visitLog.check_out_time),
      check_in_lat: coordToInput(visitLog.check_in_lat),
      check_in_lng: coordToInput(visitLog.check_in_lng),
      check_out_lat: coordToInput(visitLog.check_out_lat),
      check_out_lng: coordToInput(visitLog.check_out_lng),
      notes: visitLog.notes,
      outcome: visitLog.outcome,
      status: visitLog.status,
    },
  });

  const partyId = useWatch({ control: form.control, name: "party_id" });

  const filteredPlans = useMemo(() => {
    if (!partyId) return [];
    return linkableVisitPlans.filter(
      (p) => p.party_id === partyId && p.user_id === visitLog.user_id
    );
  }, [linkableVisitPlans, partyId, visitLog.user_id]);

  const partyRows = parties.some((p) => p.id === visitLog.party_id)
    ? parties
    : [{ id: visitLog.party_id, name: visitLog.party_name ?? visitLog.party_id }, ...parties];

  function onSubmit(values: UpdateVisitLogInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateVisitLogAction({
        ...values,
        visitLogId: visitLog.id,
        notes: values.notes?.trim() ?? "",
        outcome: values.outcome?.trim() ?? "",
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
        <CardTitle>Edit visit log</CardTitle>
        <CardDescription>
          Updates are allowed for admins anytime, and for the visitor within 72 hours of creation.
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
            <Label htmlFor="visit_plan_id">Link visit plan (optional)</Label>
            <select
              id="visit_plan_id"
              className={selectClass}
              {...form.register("visit_plan_id", {
                setValueAs: (v) => (v === "" ? "" : v),
              })}
              disabled={
                filteredPlans.length === 0 &&
                !(visitLog.visit_plan_id && visitLog.visit_plan_visit_date)
              }
            >
              <option value="">None</option>
              {visitLog.visit_plan_id &&
              !filteredPlans.some((p) => p.id === visitLog.visit_plan_id) ? (
                <option value={visitLog.visit_plan_id}>
                  Current plan ({visitLog.visit_plan_visit_date ?? visitLog.visit_plan_id})
                </option>
              ) : null}
              {filteredPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.visit_date} — {p.purpose.slice(0, 60)}
                  {p.purpose.length > 60 ? "…" : ""}
                </option>
              ))}
            </select>
            {visitLog.visit_plan_id &&
            !filteredPlans.some((p) => p.id === visitLog.visit_plan_id) ? (
              <p className="text-muted-foreground text-xs">
                Linked plan may be outside your normal list (visibility). You can clear or change
                when another plan is available.
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
              <Input
                id="check_out_time"
                type="datetime-local"
                {...form.register("check_out_time")}
              />
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Link
            href={ROUTES.visitLogs}
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
