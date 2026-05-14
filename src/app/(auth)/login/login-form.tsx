"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resolvePostLoginPathAction } from "@/app/(auth)/login/actions";
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
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError("Login failed. Check your credentials and try again.");
      return;
    }

    const rawNext = searchParams.get("next");
    const path = await resolvePostLoginPathAction(rawNext);

    window.location.assign(path);
  }

  return (
    <div className="space-y-4">
      <Card className="w-full rounded-[1.75rem] border border-white/85 bg-card/90 py-0 shadow-[var(--shadow-lg)] backdrop-blur-sm dark:border-white/10">
        <CardHeader className="gap-2 px-6 pb-0 pt-5 sm:px-7 sm:pt-6">
          <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Secure workspace access
          </div>
          <div className="space-y-2">
            <CardTitle className="text-[1.7rem] font-semibold tracking-[-0.03em] text-foreground">
              Welcome back
            </CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
              Sign in to access your sales workspace.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 px-6 pb-0 pt-4 sm:px-7">
            {searchParams.get("error") === "auth" && (
              <p
                className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                Authentication failed. Request a new link or try again.
              </p>
            )}

            {formError && (
              <p
                className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {formError}
              </p>
            )}

            <div className="space-y-2.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground/80"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-12 rounded-2xl border-border/80 bg-background/65 px-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] focus-visible:border-primary/45 focus-visible:bg-background/90 focus-visible:ring-primary/20 dark:shadow-none"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground/80"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-12 rounded-2xl border-border/80 bg-background/65 px-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] focus-visible:border-primary/45 focus-visible:bg-background/90 focus-visible:ring-primary/20 dark:shadow-none"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="rounded-[1.1rem] border border-border/80 bg-muted/45 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Protected access
              </p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Your access follows your assigned role and organization permissions.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-0 bg-transparent px-6 pb-5 pt-4 sm:px-7 sm:pb-6">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className={cn(
                "h-12 w-full rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)]",
                "transition-[transform,box-shadow,background-color] duration-200 ease-out",
                "hover:scale-[1.01] hover:bg-primary/92 hover:shadow-[var(--shadow-lg)] active:scale-[0.99]",
                "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
              )}
            >
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-[11px] leading-5 text-muted-foreground">
              Existing redirect rules still apply after sign-in.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
