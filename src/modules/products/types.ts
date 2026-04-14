import type { ProductStatus } from "@/constants/statuses";

export type Product = {
  id: string;
  organization_id: string;
  product_name: string;
  item_code: string;
  unit: string;
  base_price: number;
  category: string | null;
  description: string | null;
  status: ProductStatus;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};
