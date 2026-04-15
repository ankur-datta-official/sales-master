import { z } from "zod";

import { VISIT_LOG_STATUSES } from "@/constants/statuses";

/** Mirrors `visit_logs_update_owner_recent` (72 hours) for UI hints */
export const VISIT_LOG_OWNER_EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;

export function isVisitLogOwnerEditableWindow(
  createdAt: string,
  logUserId: string,
  profileId: string
): boolean {
  if (logUserId !== profileId) return false;
  const age = Date.now() - new Date(createdAt).getTime();
  return age >= 0 && age <= VISIT_LOG_OWNER_EDIT_WINDOW_MS;
}

const optionalUuid = z.union([z.string().uuid(), z.literal("")]).optional();

export const createVisitLogSchema = z.object({
  organization_id: z.string().uuid(),
  party_id: z.string().uuid(),
  assignee_user_id: z.string().uuid().optional(),
  visit_plan_id: optionalUuid,
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  check_in_lat: z.string().optional(),
  check_in_lng: z.string().optional(),
  check_out_lat: z.string().optional(),
  check_out_lng: z.string().optional(),
  notes: z.string().max(8000).optional(),
  outcome: z.string().max(8000).optional(),
  status: z.enum(VISIT_LOG_STATUSES),
});

export const updateVisitLogSchema = z.object({
  visitLogId: z.string().uuid(),
  party_id: z.string().uuid(),
  visit_plan_id: optionalUuid,
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  check_in_lat: z.string().optional(),
  check_in_lng: z.string().optional(),
  check_out_lat: z.string().optional(),
  check_out_lng: z.string().optional(),
  notes: z.string().max(8000).optional(),
  outcome: z.string().max(8000).optional(),
  status: z.enum(VISIT_LOG_STATUSES),
});

export type CreateVisitLogInput = z.infer<typeof createVisitLogSchema>;
export type UpdateVisitLogInput = z.infer<typeof updateVisitLogSchema>;

export function isVisitLogStatus(value: string): value is (typeof VISIT_LOG_STATUSES)[number] {
  return (VISIT_LOG_STATUSES as readonly string[]).includes(value);
}
