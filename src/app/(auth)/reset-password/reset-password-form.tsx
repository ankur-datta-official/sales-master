"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/modules/auth/schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setFormError("Could not update the password. Request a fresh recovery link and try again.");
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace(`${ROUTES.login}?reset=success`);
  }

  return (
    <Card className="w-full rounded-[1.75rem] border border-white/85 bg-card/90 py-0 shadow-[var(--shadow-lg)] backdrop-blur-sm dark:border-white/10">
      <CardHeader className="gap-2 px-6 pb-0 pt-5 sm:px-7 sm:pt-6">
        <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.75 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Password reset
        </div>
        <div className="space-y-2">
          <CardTitle className="text-[1.7rem] font-semibold tracking-[-0.03em] text-foreground">
            Set a new password
          </CardTitle>
          <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
            Finish your recovery or setup flow by choosing a new secure password.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 px-6 pb-0 pt-4 sm:px-7">
          {formError ? (
            <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Field
            id="reset_password"
            label="New password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="reset_password"
              type="password"
              className={inputClassName}
              {...form.register("password")}
            />
          </Field>
          <Field
            id="reset_confirm_password"
            label="Confirm password"
            error={form.formState.errors.confirm_password?.message}
          >
            <Input
              id="reset_confirm_password"
              type="password"
              className={inputClassName}
              {...form.register("confirm_password")}
            />
          </Field>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-0 bg-transparent px-6 pb-5 pt-5 sm:px-7 sm:pb-6">
          <Button type="submit" disabled={isSubmitting} className={submitClassName}>
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

const inputClassName =
  "h-12 rounded-2xl border-border/80 bg-background/65 px-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] focus-visible:border-primary/45 focus-visible:bg-background/90 focus-visible:ring-primary/20 dark:shadow-none";

const submitClassName = cn(
  "h-12 w-full rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)]",
  "transition-[transform,box-shadow,background-color] duration-200 ease-out",
  "hover:scale-[1.01] hover:bg-primary/92 hover:shadow-[var(--shadow-lg)] active:scale-[0.99]"
);
