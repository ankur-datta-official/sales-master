import { z } from "zod";

import {
  WORK_PLAN_PRIORITIES,
} from "@/constants/statuses";

const workPlanPrioritySchema = z.enum(WORK_PLAN_PRIORITIES);

export const createWorkPlanSchema = z.object({
  organization_id: z.string().uuid(),
  plan_date: z.string().date(),
  title: z.string().min(1).max(200),
  details: z.string().min(1).max(4000),
  priority: workPlanPrioritySchema.nullable().optional(),
  status: z.literal("draft"),
});

export const updateDraftWorkPlanSchema = z.object({
  workPlanId: z.string().uuid(),
  plan_date: z.string().date(),
  title: z.string().min(1).max(200),
  details: z.string().min(1).max(4000),
  priority: workPlanPrioritySchema.nullable().optional(),
});

export const submitWorkPlanSchema = z.object({
  workPlanId: z.string().uuid(),
});

export const reviewWorkPlanSchema = z.object({
  workPlanId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  review_note: z.string().max(1500).nullable().optional(),
});

export type CreateWorkPlanInput = z.infer<typeof createWorkPlanSchema>;
export type UpdateDraftWorkPlanInput = z.infer<typeof updateDraftWorkPlanSchema>;
export type SubmitWorkPlanInput = z.infer<typeof submitWorkPlanSchema>;
export type ReviewWorkPlanInput = z.infer<typeof reviewWorkPlanSchema>;
