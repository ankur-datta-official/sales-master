"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { requestPasswordResetAction } from "@/modules/auth/actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/modules/auth/schemas";
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
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSent, setIsSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    setIsSent(false);
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setIsSent(true);
    });
  }

  return (
    <Card className="w-full rounded-[1.75rem] border border-white/85 bg-card/90 py-0 shadow-[var(--shadow-lg)] backdrop-blur-sm dark:border-white/10">
      <CardHeader className="gap-2 px-6 pb-0 pt-5 sm:px-7 sm:pt-6">
        <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.75 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          Password recovery
        </div>
        <div className="space-y-2">
          <CardTitle className="text-[1.7rem] font-semibold tracking-[-0.03em] text-foreground">
            Reset your password
          </CardTitle>
          <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
            Enter your workspace email and we will send a secure password reset link.
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
          {isSent ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              A password reset link has been sent if the email belongs to an existing account.
            </p>
          ) : null}

          <div className="space-y-2.5">
            <Label htmlFor="forgot_email" className="text-sm font-medium text-foreground/80">
              Email
            </Label>
            <Input
              id="forgot_email"
              type="email"
              className={inputClassName}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-0 bg-transparent px-6 pb-5 pt-5 sm:px-7 sm:pb-6">
          <Button type="submit" disabled={isPending} className={submitClassName}>
            {isPending ? "Sending reset link..." : "Send reset link"}
          </Button>
          <Link
            href={ROUTES.login}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

const inputClassName =
  "h-12 rounded-2xl border-border/80 bg-background/65 px-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] focus-visible:border-primary/45 focus-visible:bg-background/90 focus-visible:ring-primary/20 dark:shadow-none";

const submitClassName = cn(
  "h-12 w-full rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)]",
  "transition-[transform,box-shadow,background-color] duration-200 ease-out",
  "hover:scale-[1.01] hover:bg-primary/92 hover:shadow-[var(--shadow-lg)] active:scale-[0.99]"
);
