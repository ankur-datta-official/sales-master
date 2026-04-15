import { z } from "zod";

import {
  COLLECTION_TARGET_PERIOD_TYPES,
  COLLECTION_TARGET_STATUSES,
} from "@/constants/statuses";

const optionalPartyId = z.union([z.string().uuid(), z.literal("")]).optional();

export const createCollectionTargetSchema = z
  .object({
    organization_id: z.string().uuid(),
    assigned_to_user_id: z.string().uuid(),
    party_id: optionalPartyId,
    period_type: z.enum(COLLECTION_TARGET_PERIOD_TYPES),
    start_date: z.string().date(),
    end_date: z.string().date(),
    target_amount: z.number().positive(),
    status: z.enum(COLLECTION_TARGET_STATUSES),
  })
  .refine((d) => d.start_date <= d.end_date, {
    message: "End date must be on or after start date.",
    path: ["end_date"],
  });

export const updateCollectionTargetSchema = z
  .object({
    collectionTargetId: z.string().uuid(),
    assigned_to_user_id: z.string().uuid(),
    party_id: optionalPartyId,
    period_type: z.enum(COLLECTION_TARGET_PERIOD_TYPES),
    start_date: z.string().date(),
    end_date: z.string().date(),
    target_amount: z.number().positive(),
    status: z.enum(COLLECTION_TARGET_STATUSES),
  })
  .refine((d) => d.start_date <= d.end_date, {
    message: "End date must be on or after start date.",
    path: ["end_date"],
  });

export type CreateCollectionTargetInput = z.infer<typeof createCollectionTargetSchema>;
export type UpdateCollectionTargetInput = z.infer<typeof updateCollectionTargetSchema>;

export function isCollectionTargetStatus(
  value: string
): value is (typeof COLLECTION_TARGET_STATUSES)[number] {
  return (COLLECTION_TARGET_STATUSES as readonly string[]).includes(value);
}

export function isCollectionTargetPeriodType(
  value: string
): value is (typeof COLLECTION_TARGET_PERIOD_TYPES)[number] {
  return (COLLECTION_TARGET_PERIOD_TYPES as readonly string[]).includes(value);
}
