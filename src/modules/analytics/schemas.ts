import { z } from "zod";

export const analyticsFiltersSchema = z.object({
  dateFrom: z.string().optional().default(""),
  dateTo: z.string().optional().default(""),
  scope: z.enum(["own", "team"]).optional().default("team"),
  user: z.string().optional().default(""),
  party: z.string().optional().default(""),
});

export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;
