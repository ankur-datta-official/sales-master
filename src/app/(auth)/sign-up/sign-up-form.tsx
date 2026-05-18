"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createWorkspaceSignUpAction,
  joinWorkspaceSignUpAction,
} from "@/modules/auth/actions";
import {
  createWorkspaceSignUpSchema,
  joinWorkspaceSignUpSchema,
  type CreateWorkspaceSignUpInput,
  type JoinWorkspaceSignUpInput,
} from "@/modules/auth/schemas";
import { SIGNUP_MODES, type SignupMode } from "@/modules/auth/types";
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
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type CreateValues = CreateWorkspaceSignUpInput;
type JoinValues = JoinWorkspaceSignUpInput;

const modeOptions: Array<{ id: SignupMode; label: string; hint: string }> = [
  {
    id: SIGNUP_MODES[0],
    label: "Create Workspace",
    hint: "Set up a new organization and become the workspace admin.",
  },
  {
    id: SIGNUP_MODES[1],
    label: "Join Workspace",
    hint: "Request access to an existing organization by workspace slug.",
  },
];

export function SignUpForm() {
  const [mode, setMode] = useState<SignupMode>("create_workspace");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createWorkspaceSignUpSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      organization_name: "",
      workspace_slug: "",
    },
  });

  const joinForm = useForm<JoinValues>({
    resolver: zodResolver(joinWorkspaceSignUpSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      workspace_slug: "",
      note: "",
    },
  });

  async function signInAfterSetup(email: string, password: string) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setFormError(
        "Your account was created, but automatic sign-in failed. Please use the login page."
      );
      return;
    }

    const path = await resolvePostLoginPathAction(null);
    window.location.assign(path);
  }

  function onCreateWorkspace(values: CreateValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await createWorkspaceSignUpAction(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (!result.data) return;

      signInAfterSetup(result.data.email, values.password);
    });
  }

  function onJoinWorkspace(values: JoinValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await joinWorkspaceSignUpAction(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (!result.data) return;

      signInAfterSetup(result.data.email, values.password);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="w-full rounded-[1.75rem] border border-white/85 bg-card/90 py-0 shadow-[var(--shadow-lg)] backdrop-blur-sm dark:border-white/10">
        <CardHeader className="gap-2 px-6 pb-0 pt-5 sm:px-7 sm:pt-6">
          <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.75 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Workspace onboarding
          </div>
          <div className="space-y-2">
            <CardTitle className="text-[1.7rem] font-semibold tracking-[-0.03em] text-foreground">
              Create or join Sales Master
            </CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
              Choose how you want to enter the workspace. Existing workspace requests wait for admin approval.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-0 pt-4 sm:px-7">
          <div className="grid gap-2 sm:grid-cols-2">
            {modeOptions.map((option) => {
              const isActive = option.id === mode;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setMode(option.id);
                    setFormError(null);
                  }}
                  className={cn(
                    "rounded-[1.15rem] border px-4 py-3 text-left transition-colors",
                    isActive
                      ? "border-primary/30 bg-primary/10 text-foreground shadow-[var(--shadow-xs)]"
                      : "border-border/70 bg-background/55 text-muted-foreground hover:border-primary/20 hover:bg-background/80"
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{option.label}</p>
                  <p className="mt-1 text-xs leading-5">{option.hint}</p>
                </button>
              );
            })}
          </div>

          {formError && (
            <p
              className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </p>
          )}

          {mode === "create_workspace" ? (
            <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreateWorkspace)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
              <Field
                label="Full name"
                id="create_full_name"
                error={createForm.formState.errors.full_name?.message}
              >
                <Input id="create_full_name" className={inputClassName} {...createForm.register("full_name")} />
              </Field>
                </div>
                <div className="sm:col-span-1">
              <Field
                label="Work email"
                id="create_email"
                error={createForm.formState.errors.email?.message}
              >
                <Input id="create_email" type="email" className={inputClassName} {...createForm.register("email")} />
              </Field>
                </div>
                <div className="sm:col-span-1">
              <Field
                label="Password"
                id="create_password"
                error={createForm.formState.errors.password?.message}
              >
                <Input id="create_password" type="password" className={inputClassName} {...createForm.register("password")} />
              </Field>
                </div>
                <div className="sm:col-span-1">
              <Field
                label="Organization name"
                id="organization_name"
                error={createForm.formState.errors.organization_name?.message}
              >
                <Input id="organization_name" className={inputClassName} {...createForm.register("organization_name")} />
              </Field>
                </div>
                <div className="sm:col-span-2">
              <Field
                label="Workspace slug"
                id="workspace_slug"
                error={createForm.formState.errors.workspace_slug?.message}
              >
                <Input id="workspace_slug" className={inputClassName} {...createForm.register("workspace_slug")} />
              </Field>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isPending || createForm.formState.isSubmitting}
                className={submitClassName}
              >
                {isPending ? "Setting up workspace..." : "Create workspace"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={joinForm.handleSubmit(onJoinWorkspace)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
              <Field
                label="Full name"
                id="join_full_name"
                error={joinForm.formState.errors.full_name?.message}
              >
                <Input id="join_full_name" className={inputClassName} {...joinForm.register("full_name")} />
              </Field>
                </div>
                <div className="sm:col-span-1">
              <Field
                label="Work email"
                id="join_email"
                error={joinForm.formState.errors.email?.message}
              >
                <Input id="join_email" type="email" className={inputClassName} {...joinForm.register("email")} />
              </Field>
                </div>
                <div className="sm:col-span-1">
              <Field
                label="Password"
                id="join_password"
                error={joinForm.formState.errors.password?.message}
              >
                <Input id="join_password" type="password" className={inputClassName} {...joinForm.register("password")} />
              </Field>
                </div>
                <div className="sm:col-span-1">
              <Field
                label="Workspace slug"
                id="join_workspace_slug"
                error={joinForm.formState.errors.workspace_slug?.message}
              >
                <Input id="join_workspace_slug" className={inputClassName} {...joinForm.register("workspace_slug")} />
              </Field>
                </div>
                <div className="sm:col-span-2">
              <Field label="Note to admin (optional)" id="join_note" error={joinForm.formState.errors.note?.message}>
                <Textarea id="join_note" className="min-h-24 rounded-2xl" {...joinForm.register("note")} />
              </Field>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isPending || joinForm.formState.isSubmitting}
                className={submitClassName}
              >
                {isPending ? "Submitting request..." : "Request access"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-0 bg-transparent px-6 pb-5 pt-5 sm:px-7 sm:pb-6">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Already have access?</span>
            <Link
              href={ROUTES.login}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

const inputClassName =
  "h-12 rounded-2xl border-border/80 bg-background/65 px-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] focus-visible:border-primary/45 focus-visible:bg-background/90 focus-visible:ring-primary/20 dark:shadow-none";

const submitClassName = cn(
  "h-12 w-full rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)]",
  "transition-[transform,box-shadow,background-color] duration-200 ease-out",
  "hover:scale-[1.01] hover:bg-primary/92 hover:shadow-[var(--shadow-lg)] active:scale-[0.99]",
  "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
);

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
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
