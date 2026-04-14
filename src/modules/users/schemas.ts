import { z } from "zod";

import { PROFILE_LIFECYCLE_STATUSES } from "@/constants/statuses";

const profileStatusSchema = z.enum(PROFILE_LIFECYCLE_STATUSES);

export const createOrgUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(200),
  organization_id: z.string().uuid(),
  role_id: z.string().uuid(),
  branch_id: z.string().uuid().nullable().optional(),
  reports_to_user_id: z.string().uuid().nullable().optional(),
  status: profileStatusSchema,
  phone: z.string().max(120).nullable().optional(),
  employee_code: z.string().max(120).nullable().optional(),
  designation: z.string().max(200).nullable().optional(),
});

export const updateOrgUserSchema = z.object({
  userId: z.string().uuid(),
  full_name: z.string().min(1).max(200),
  role_id: z.string().uuid(),
  branch_id: z.string().uuid().nullable().optional(),
  reports_to_user_id: z.string().uuid().nullable().optional(),
  status: profileStatusSchema,
  phone: z.string().max(120).nullable().optional(),
  employee_code: z.string().max(120).nullable().optional(),
  designation: z.string().max(200).nullable().optional(),
});

export type CreateOrgUserInput = z.infer<typeof createOrgUserSchema>;
export type UpdateOrgUserInput = z.infer<typeof updateOrgUserSchema>;
