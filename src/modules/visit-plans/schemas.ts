import { z } from "zod";

import { VISIT_PLAN_STATUSES } from "@/constants/statuses";

const terminalVisitStatuses = z.enum(["completed", "skipped", "cancelled"]);

export const createVisitPlanSchema = z.object({
  organization_id: z.string().uuid(),
  party_id: z.string().uuid(),
  visit_date: z.string().date(),
  purpose: z.string().min(1).max(2000),
  assignee_user_id: z.string().uuid().optional(),
});

export const updatePlannedVisitPlanSchema = z.object({
  visitPlanId: z.string().uuid(),
  party_id: z.string().uuid(),
  visit_date: z.string().date(),
  purpose: z.string().min(1).max(2000),
});

export const updateVisitPlanStatusSchema = z.object({
  visitPlanId: z.string().uuid(),
  status: terminalVisitStatuses,
});

export type CreateVisitPlanInput = z.infer<typeof createVisitPlanSchema>;
export type UpdatePlannedVisitPlanInput = z.infer<typeof updatePlannedVisitPlanSchema>;
export type UpdateVisitPlanStatusInput = z.infer<typeof updateVisitPlanStatusSchema>;

export function isVisitPlanStatus(value: string): value is (typeof VISIT_PLAN_STATUSES)[number] {
  return (VISIT_PLAN_STATUSES as readonly string[]).includes(value);
}
