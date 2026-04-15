import { z } from "zod";

export const accountsApproveDemandOrderSchema = z.object({
  demandOrderId: z.string().uuid(),
  note: z.string().max(4000).optional(),
});

export const accountsRejectDemandOrderSchema = z.object({
  demandOrderId: z.string().uuid(),
  note: z.string().max(4000).optional(),
});

export type AccountsApproveDemandOrderInput = z.infer<typeof accountsApproveDemandOrderSchema>;
export type AccountsRejectDemandOrderInput = z.infer<typeof accountsRejectDemandOrderSchema>;
