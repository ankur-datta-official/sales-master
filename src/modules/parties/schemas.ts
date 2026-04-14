import { z } from "zod";

import { PARTY_STATUSES } from "@/constants/statuses";

const partyStatusSchema = z.enum(PARTY_STATUSES);

export const createPartySchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().max(100).nullable().optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
  contact_person: z.string().max(200).nullable().optional(),
  phone: z.string().max(120).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  notes: z.string().max(1500).nullable().optional(),
  status: partyStatusSchema,
});

export const updatePartySchema = z.object({
  partyId: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().max(100).nullable().optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
  contact_person: z.string().max(200).nullable().optional(),
  phone: z.string().max(120).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  notes: z.string().max(1500).nullable().optional(),
  status: partyStatusSchema,
});

export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
