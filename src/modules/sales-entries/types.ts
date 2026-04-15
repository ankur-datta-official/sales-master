import type { SalesEntrySource } from "@/constants/statuses";

export type SalesEntry = {
  id: string;
  organization_id: string;
  user_id: string;
  party_id: string;
  entry_date: string;
  amount: number;
  quantity: number;
  remarks: string;
  source: SalesEntrySource;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SalesEntryWithRelations = SalesEntry & {
  party_name: string | null;
  party_code: string | null;
  seller_name: string | null;
  seller_email: string | null;
  creator_name: string | null;
  creator_email: string | null;
};
