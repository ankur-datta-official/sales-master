/** Shared PostgREST select for approval log rows with actor joins. */
export const APPROVAL_LOG_ROW_SELECT =
  "id, organization_id, entity_type, entity_id, action, from_user_id, to_user_id, acted_by_user_id, note, created_at, actor:profiles!approval_logs_acted_by_user_id_fkey(full_name, email), from_person:profiles!approval_logs_from_user_id_fkey(full_name, email), to_person:profiles!approval_logs_to_user_id_fkey(full_name, email)";
