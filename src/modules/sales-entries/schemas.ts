import { z } from "zod";

import { SALES_ENTRY_SOURCES } from "@/constants/statuses";

/** Mirrors `sales_entries_update_owner_recent` (72 hours) */
export const SALES_ENTRY_OWNER_EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;

export function isSalesEntryOwnerEditableWindow(
  createdAt: string,
  entryUserId: string,
  profileId: string
): boolean {
  if (entryUserId !== profileId) return false;
  const age = Date.now() - new Date(createdAt).getTime();
  return age >= 0 && age <= SALES_ENTRY_OWNER_EDIT_WINDOW_MS;
}

export const createSalesEntrySchema = z.object({
  organization_id: z.string().uuid(),
  party_id: z.string().uuid(),
  assignee_user_id: z.string().uuid().optional(),
  entry_date: z.string().date(),
  amount: z.number().positive(),
  quantity: z.number().nonnegative(),
  remarks: z.string().max(8000).optional(),
  source: z.enum(SALES_ENTRY_SOURCES),
});

export const updateSalesEntrySchema = z.object({
  salesEntryId: z.string().uuid(),
  party_id: z.string().uuid(),
  entry_date: z.string().date(),
  amount: z.number().positive(),
  quantity: z.number().nonnegative(),
  remarks: z.string().max(8000).optional(),
});

export type CreateSalesEntryInput = z.infer<typeof createSalesEntrySchema>;
export type UpdateSalesEntryInput = z.infer<typeof updateSalesEntrySchema>;
