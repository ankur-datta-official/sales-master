import { z } from "zod";

export const demandOrderLineInputSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  remark: z.string().max(2000).optional(),
});

export const createDemandOrderSchema = z.object({
  organization_id: z.string().uuid(),
  party_id: z.string().uuid(),
  assignee_user_id: z.string().uuid().optional(),
  order_date: z.string().date(),
  remarks: z.string().max(8000).optional(),
  items: z.array(demandOrderLineInputSchema).min(1, "Add at least one line item."),
});

export const updateDraftDemandOrderSchema = z.object({
  demandOrderId: z.string().uuid(),
  party_id: z.string().uuid(),
  order_date: z.string().date(),
  remarks: z.string().max(8000).optional(),
  items: z.array(demandOrderLineInputSchema).min(1, "Add at least one line item."),
});

export const submitDemandOrderSchema = z.object({
  demandOrderId: z.string().uuid(),
});

export type DemandOrderLineInput = z.infer<typeof demandOrderLineInputSchema>;
export type CreateDemandOrderInput = z.infer<typeof createDemandOrderSchema>;
export type UpdateDraftDemandOrderInput = z.infer<typeof updateDraftDemandOrderSchema>;
export type SubmitDemandOrderInput = z.infer<typeof submitDemandOrderSchema>;
