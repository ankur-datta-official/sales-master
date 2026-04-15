import { z } from "zod";

export const fieldActivitySummaryFiltersSchema = z.object({
  stale_minutes: z.coerce.number().int().min(1).max(240).default(10),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export type FieldActivitySummaryFilters = z.infer<typeof fieldActivitySummaryFiltersSchema>;

export const fieldActivityDetailFiltersSchema = z.object({
  stale_minutes: z.coerce.number().int().min(1).max(240).default(10),
  points_limit: z.coerce.number().int().min(5).max(200).default(40),
  timeline_limit: z.coerce.number().int().min(5).max(100).default(30),
});

export type FieldActivityDetailFilters = z.infer<typeof fieldActivityDetailFiltersSchema>;
