import { z } from "zod";

import {
  SALES_TARGET_PERIOD_TYPES,
  SALES_TARGET_STATUSES,
} from "@/constants/statuses";

const optionalPartyId = z.union([z.string().uuid(), z.literal("")]).optional();

/** Accepts empty string from inputs; normalized to number | null in server actions. */
const optionalQtyInput = z.union([z.string(), z.number(), z.nan()]).optional();

export const createSalesTargetSchema = z
  .object({
    organization_id: z.string().uuid(),
    assigned_to_user_id: z.string().uuid(),
    party_id: optionalPartyId,
    period_type: z.enum(SALES_TARGET_PERIOD_TYPES),
    start_date: z.string().date(),
    end_date: z.string().date(),
    target_amount: z.number().positive(),
    target_qty: optionalQtyInput,
    status: z.enum(SALES_TARGET_STATUSES),
  })
  .refine((d) => d.start_date <= d.end_date, {
    message: "End date must be on or after start date.",
    path: ["end_date"],
  });

export const updateSalesTargetSchema = z
  .object({
    salesTargetId: z.string().uuid(),
    assigned_to_user_id: z.string().uuid(),
    party_id: optionalPartyId,
    period_type: z.enum(SALES_TARGET_PERIOD_TYPES),
    start_date: z.string().date(),
    end_date: z.string().date(),
    target_amount: z.number().positive(),
    target_qty: optionalQtyInput,
    status: z.enum(SALES_TARGET_STATUSES),
  })
  .refine((d) => d.start_date <= d.end_date, {
    message: "End date must be on or after start date.",
    path: ["end_date"],
  });

export type CreateSalesTargetInput = z.infer<typeof createSalesTargetSchema>;
export type UpdateSalesTargetInput = z.infer<typeof updateSalesTargetSchema>;

export function isSalesTargetStatus(
  value: string
): value is (typeof SALES_TARGET_STATUSES)[number] {
  return (SALES_TARGET_STATUSES as readonly string[]).includes(value);
}

export function isSalesTargetPeriodType(
  value: string
): value is (typeof SALES_TARGET_PERIOD_TYPES)[number] {
  return (SALES_TARGET_PERIOD_TYPES as readonly string[]).includes(value);
}
