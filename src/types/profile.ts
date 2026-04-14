/**
 * App-facing profile shape.
 * Keep this tolerant while the database evolves from the lightweight auth profile
 * into the fuller business profile schema.
 */
export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  phone: string | null;
  employee_code: string | null;
  designation: string | null;
  organization_id: string | null;
  branch_id: string | null;
  role_id: string | null;
  reports_to_user_id: string | null;
  is_field_user: boolean | null;
  joined_at: string | null;

  /**
   * Legacy/lightweight fields kept optional so the UI can read older Supabase
   * tables without breaking during migration.
   */
  display_name?: string | null;
  role?: string | null;
  created_at: string | null;
  updated_at: string | null;
};
