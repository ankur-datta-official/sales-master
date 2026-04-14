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
import { PROFILE_LIFECYCLE_STATUSES } from "@/constants/statuses";
import type { UserProfile } from "@/types/profile";
import { cn } from "@/lib/utils";
import { updateOrgUserAction } from "@/modules/users/actions";
import { updateOrgUserSchema, type UpdateOrgUserInput } from "@/modules/users/schemas";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type RoleOption = { id: string; name: string; slug: string; level: number };
type BranchOption = { id: string; name: string; code: string };
type ManagerOption = { id: string; full_name: string | null; email: string | null };

type UpdateUserFormProps = {
  profile: UserProfile;
  roles: RoleOption[];
  branches: BranchOption[];
  managers: ManagerOption[];
};

export function UpdateUserForm({
  profile,
  roles,
  branches,
  managers,
}: UpdateUserFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateOrgUserInput>({
    resolver: zodResolver(updateOrgUserSchema),
    defaultValues: {
      userId: profile.id,
      full_name: profile.full_name ?? "",
      role_id: profile.role_id ?? roles[0]?.id ?? "",
      branch_id: profile.branch_id,
      reports_to_user_id: profile.reports_to_user_id,
      status: (profile.status as UpdateOrgUserInput["status"]) ?? "active",
      phone: profile.phone ?? "",
      employee_code: profile.employee_code ?? "",
      designation: profile.designation ?? "",
    },
  });

  function onSubmit(values: UpdateOrgUserInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrgUserAction({
        ...values,
        userId: profile.id,
        branch_id: values.branch_id || null,
        reports_to_user_id: values.reports_to_user_id || null,
        phone: values.phone?.trim() || null,
        employee_code: values.employee_code?.trim() || null,
        designation: values.designation?.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const managerChoices = managers.filter((m) => m.id !== profile.id);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Edit user</CardTitle>
        <CardDescription>Update role, reporting line, and employment fields.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email ?? "—"} disabled className="opacity-80" readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...form.register("full_name")} />
            {form.formState.errors.full_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_id">Role</Label>
            <select id="role_id" className={selectClass} {...form.register("role_id")}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.slug})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch_id">Branch</Label>
            <select
              id="branch_id"
              className={selectClass}
              {...form.register("branch_id", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            >
              <option value="">— None —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reports_to_user_id">Reporting manager</Label>
            <select
              id="reports_to_user_id"
              className={selectClass}
              {...form.register("reports_to_user_id", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            >
              <option value="">— None —</option>
              {managerChoices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? m.email ?? m.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...form.register("status")}>
              {PROFILE_LIFECYCLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee_code">Employee code</Label>
            <Input id="employee_code" {...form.register("employee_code")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" {...form.register("designation")} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || roles.length === 0}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
          <Link
            href={ROUTES.users}
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
