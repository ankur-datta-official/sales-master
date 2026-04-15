import { z } from "zod";

import { FACTORY_DISPATCH_STATUSES } from "@/constants/statuses";

export const updateFactoryDispatchSchema = z.object({
  dispatchId: z.string().uuid(),
  factory_status: z.enum(FACTORY_DISPATCH_STATUSES),
  challan_no: z.string().optional(),
  memo_no: z.string().optional(),
  dispatch_date: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "Invalid date"
    ),
  remarks: z.string().optional(),
});

export type UpdateFactoryDispatchInput = z.infer<typeof updateFactoryDispatchSchema>;
