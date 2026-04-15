import { z } from "zod";

/** Outcomes allowed from the verification action (unverified rows only). */
export const VERIFY_COLLECTION_ENTRY_STATUSES = ["verified", "rejected"] as const;

/** Mirrors `collection_entries_update_owner_recent` (72 hours) */
export const COLLECTION_ENTRY_OWNER_EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;

export function isCollectionEntryOwnerEditableWindow(
  createdAt: string,
  entryUserId: string,
  profileId: string
): boolean {
  if (entryUserId !== profileId) return false;
  const age = Date.now() - new Date(createdAt).getTime();
  return age >= 0 && age <= COLLECTION_ENTRY_OWNER_EDIT_WINDOW_MS;
}

export const createCollectionEntrySchema = z.object({
  organization_id: z.string().uuid(),
  party_id: z.string().uuid(),
  assignee_user_id: z.string().uuid().optional(),
  entry_date: z.string().date(),
  amount: z.number().positive(),
  remarks: z.string().max(8000).optional(),
});

export const updateCollectionEntrySchema = z.object({
  collectionEntryId: z.string().uuid(),
  party_id: z.string().uuid(),
  entry_date: z.string().date(),
  amount: z.number().positive(),
  remarks: z.string().max(8000).optional(),
});

export const verifyCollectionEntrySchema = z.object({
  collectionEntryId: z.string().uuid(),
  verification_status: z.enum(VERIFY_COLLECTION_ENTRY_STATUSES),
});

export type CreateCollectionEntryInput = z.infer<typeof createCollectionEntrySchema>;
export type UpdateCollectionEntryInput = z.infer<typeof updateCollectionEntrySchema>;
export type VerifyCollectionEntryInput = z.infer<typeof verifyCollectionEntrySchema>;
