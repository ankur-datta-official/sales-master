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
import { cn } from "@/lib/utils";
import { createOrgUserAction } from "@/modules/users/actions";
import {
  createOrgUserSchema,
  type CreateOrgUserInput,
} from "@/modules/users/schemas";

const selectClass = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

type RoleOption = { id: string; name: string; slug: string; level: number };
type BranchOption = { id: string; name: string; code: string };
type ManagerOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type CreateUserFormProps = {
  organizationId: string;
  roles: RoleOption[];
  branches: BranchOption[];
  managers: ManagerOption[];
};

export function CreateUserForm({
  organizationId,
  roles,
  branches,
  managers,
}: CreateUserFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateOrgUserInput>({
    resolver: zodResolver(createOrgUserSchema),
    defaultValues: {
      email: "",
      password: "",
      provisioning_mode: "send_setup_link",
      full_name: "",
      organization_id: organizationId,
      role_id: roles[0]?.id ?? "",
      branch_id: null,
      reports_to_user_id: null,
      status: "invited",
      phone: "",
      employee_code: "",
      designation: "",
    },
  });

  function onSubmit(values: CreateOrgUserInput) {
    setError(null);
    startTransition(async () => {
      const result = await createOrgUserAction({
        ...values,
        organization_id: organizationId,
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
      router.push(`${ROUTES.users}/${result.data!.userId}`);
      router.refresh();
    });
  }

  const provisioningMode = form.watch("provisioning_mode");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>New user</CardTitle>
        <CardDescription>
          Choose a secure provisioning path, then assign the user to the right role and branch.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Provisioning mode</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  form.setValue("provisioning_mode", "send_setup_link")
                }
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                  provisioningMode === "send_setup_link"
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border/75 bg-background/40 text-muted-foreground hover:border-primary/20"
                )}
              >
                <p className="font-semibold text-foreground">Send setup link</p>
                <p className="mt-1 text-xs leading-5">
                  Recommended. The employee sets their password securely from email.
                </p>
              </button>
              <button
                type="button"
                onClick={() =>
                  form.setValue("provisioning_mode", "temporary_password")
                }
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                  provisioningMode === "temporary_password"
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border/75 bg-background/40 text-muted-foreground hover:border-primary/20"
                )}
              >
                <p className="font-semibold text-foreground">Temporary password</p>
                <p className="mt-1 text-xs leading-5">
                  Use only when you must hand over credentials manually.
                </p>
              </button>
            </div>
          </div>
          {provisioningMode === "temporary_password" ? (
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...form.register("full_name")} />
            {form.formState.errors.full_name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_id">Role</Label>
            <select
              id="role_id"
              className={selectClass}
              {...form.register("role_id")}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.slug})
                </option>
              ))}
            </select>
            {form.formState.errors.role_id ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.role_id.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch_id">Branch</Label>
            <select
              id="branch_id"
              className={selectClass}
              {...form.register("branch_id", {
                setValueAs: (value) => (value === "" ? null : value),
              })}
            >
              <option value="">None</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
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
                setValueAs: (value) => (value === "" ? null : value),
              })}
            >
              <option value="">None</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.full_name ?? manager.email ?? manager.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className={selectClass}
              {...form.register("status")}
            >
              {PROFILE_LIFECYCLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
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
            {isPending
              ? provisioningMode === "temporary_password"
                ? "Creating..."
                : "Sending setup link..."
              : "Create user"}
          </Button>
          <Link
            href={ROUTES.users}
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
