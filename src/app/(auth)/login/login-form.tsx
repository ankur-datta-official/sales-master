"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { resolvePostLoginPathAction } from "@/app/(auth)/login/actions";
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

    // Use full navigation after auth success for reliable redirect in dev/prod.
    window.location.assign(path);
  }

  return (
    <div className="space-y-4">
      <div className="lg:hidden">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-9 px-2 text-muted-foreground ring-1 ring-transparent hover:bg-muted/40 hover:text-foreground hover:ring-border/70"
          )}
        >
          ← Back to home
        </Link>
      </div>

      <Card className="w-full rounded-2xl border bg-card/75 shadow-[var(--shadow-md)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl tracking-tight">Sign in</CardTitle>
          <CardDescription className="leading-relaxed">
            Enter your credentials to access your workspace.
          </CardDescription>
        </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {searchParams.get("error") === "auth" && (
            <p className="text-sm text-destructive" role="alert">
              Authentication failed. Request a new link or try again.
            </p>
          )}
          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-10"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-10"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={cn(
              "h-10 w-full sm:w-auto",
              "transition-[transform,box-shadow,background-color] duration-200 ease-out",
              "hover:shadow-[var(--shadow-md)] hover:scale-[1.02] active:scale-[0.99]",
              "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
            )}
          >
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 w-full justify-center text-muted-foreground ring-1 ring-transparent hover:bg-muted/40 hover:text-foreground hover:ring-border/70 sm:w-auto"
            )}
          >
            Back to home
          </Link>
        </CardFooter>
      </form>
      </Card>
    </div>
  );
}
