import { z } from "zod";

import { JOIN_REQUEST_STATUSES, SIGNUP_MODES } from "@/modules/auth/types";

const slugSchema = z
  .string()
  .min(3, "Use at least 3 characters")
  .max(60, "Use 60 characters or fewer")
  .regex(
    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    "Use lowercase letters, numbers, dashes, or underscores only"
  );

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use 128 characters or fewer");

export const signUpModeSchema = z.enum(SIGNUP_MODES);
export const joinRequestStatusSchema = z.enum(JOIN_REQUEST_STATUSES);

export const createWorkspaceSignUpSchema = z.object({
  full_name: z.string().min(2, "Enter your full name").max(200),
  email: z.string().email("Enter a valid work email"),
  password: passwordSchema,
  organization_name: z.string().min(2, "Enter your organization name").max(200),
  workspace_slug: slugSchema,
});

export const joinWorkspaceSignUpSchema = z.object({
  full_name: z.string().min(2, "Enter your full name").max(200),
  email: z.string().email("Enter a valid work email"),
  password: passwordSchema,
  workspace_slug: slugSchema,
  note: z.string().max(500, "Keep the note within 500 characters").optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: passwordSchema,
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const reviewJoinRequestSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  role_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  review_note: z
    .string()
    .max(500, "Keep the note within 500 characters")
    .optional()
    .nullable(),
});

export const sendUserSetupLinkSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateWorkspaceSignUpInput = z.infer<
  typeof createWorkspaceSignUpSchema
>;
export type JoinWorkspaceSignUpInput = z.infer<typeof joinWorkspaceSignUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ReviewJoinRequestInput = z.infer<typeof reviewJoinRequestSchema>;
export type SendUserSetupLinkInput = z.infer<typeof sendUserSetupLinkSchema>;

