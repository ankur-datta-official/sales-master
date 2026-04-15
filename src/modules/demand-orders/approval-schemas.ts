import { z } from "zod";

export const approveDemandOrderSchema = z.object({
  demandOrderId: z.string().uuid(),
  note: z.string().max(4000).optional(),
});

export const rejectDemandOrderSchema = z.object({
  demandOrderId: z.string().uuid(),
  note: z.string().max(4000).optional(),
});

export const forwardDemandOrderSchema = z.object({
  demandOrderId: z.string().uuid(),
  to_user_id: z.string().uuid(),
  note: z.string().max(4000).optional(),
});

export type ApproveDemandOrderInput = z.infer<typeof approveDemandOrderSchema>;
export type RejectDemandOrderInput = z.infer<typeof rejectDemandOrderSchema>;
export type ForwardDemandOrderInput = z.infer<typeof forwardDemandOrderSchema>;
