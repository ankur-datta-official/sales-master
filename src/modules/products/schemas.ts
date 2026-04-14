import { z } from "zod";

import { PRODUCT_STATUSES } from "@/constants/statuses";

const productStatusSchema = z.enum(PRODUCT_STATUSES);

export const createProductSchema = z.object({
  organization_id: z.string().uuid(),
  product_name: z.string().min(1).max(200),
  item_code: z.string().min(1).max(100),
  unit: z.string().min(1).max(50),
  base_price: z.number().min(0),
  category: z.string().max(120).nullable().optional(),
  description: z.string().max(1500).nullable().optional(),
  status: productStatusSchema,
});

export const updateProductSchema = z.object({
  productId: z.string().uuid(),
  product_name: z.string().min(1).max(200),
  item_code: z.string().min(1).max(100),
  unit: z.string().min(1).max(50),
  base_price: z.number().min(0),
  category: z.string().max(120).nullable().optional(),
  description: z.string().max(1500).nullable().optional(),
  status: productStatusSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
