import { z } from "zod";

import { WORK_REPORT_STATUSES } from "@/constants/statuses";

export const createWorkReportSchema = z.object({
  organization_id: z.string().uuid(),
  report_date: z.string().date(),
  summary: z.string().min(1).max(3000),
  achievements: z.string().max(3000).nullable().optional(),
  challenges: z.string().max(3000).nullable().optional(),
  next_step: z.string().max(3000).nullable().optional(),
  status: z.literal("draft"),
});

export const updateDraftWorkReportSchema = z.object({
  workReportId: z.string().uuid(),
  report_date: z.string().date(),
  summary: z.string().min(1).max(3000),
  achievements: z.string().max(3000).nullable().optional(),
  challenges: z.string().max(3000).nullable().optional(),
  next_step: z.string().max(3000).nullable().optional(),
});

export const submitWorkReportSchema = z.object({
  workReportId: z.string().uuid(),
});

export const reviewWorkReportSchema = z.object({
  workReportId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  review_note: z.string().max(1500).nullable().optional(),
});

export type CreateWorkReportInput = z.infer<typeof createWorkReportSchema>;
export type UpdateDraftWorkReportInput = z.infer<typeof updateDraftWorkReportSchema>;
export type SubmitWorkReportInput = z.infer<typeof submitWorkReportSchema>;
export type ReviewWorkReportInput = z.infer<typeof reviewWorkReportSchema>;

export const isValidWorkReportStatus = (value: string) =>
  WORK_REPORT_STATUSES.includes(value as (typeof WORK_REPORT_STATUSES)[number]);
