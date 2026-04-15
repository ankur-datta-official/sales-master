import type { CollectionEntryVerificationStatus } from "@/constants/statuses";

export type CollectionEntry = {
  id: string;
  organization_id: string;
  user_id: string;
  party_id: string;
  entry_date: string;
  amount: number;
  remarks: string;
  verification_status: CollectionEntryVerificationStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CollectionEntryWithRelations = CollectionEntry & {
  party_name: string | null;
  party_code: string | null;
  collector_name: string | null;
  collector_email: string | null;
  creator_name: string | null;
  creator_email: string | null;
};
