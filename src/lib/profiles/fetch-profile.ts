import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserProfile } from "@/types/profile";

let hasLoggedProfilesTableWarning = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeProfileRow(row: unknown): UserProfile | null {
  if (!isRecord(row)) return null;

  const id = toNullableString(row.id);
  if (!id) return null;

  return {
    id,
    email: toNullableString(row.email),
    full_name: toNullableString(row.full_name),
    avatar_url: toNullableString(row.avatar_url),
    status: toNullableString(row.status),
    phone: toNullableString(row.phone),
    employee_code: toNullableString(row.employee_code),
    designation: toNullableString(row.designation),
    organization_id: toNullableString(row.organization_id),
    branch_id: toNullableString(row.branch_id),
    role_id: toNullableString(row.role_id),
    reports_to_user_id: toNullableString(row.reports_to_user_id),
    is_field_user: toNullableBoolean(row.is_field_user),
    joined_at: toNullableString(row.joined_at),
    display_name: toNullableString(row.display_name),
    role: toNullableString(row.role),
    created_at: toNullableString(row.created_at),
    updated_at: toNullableString(row.updated_at),
  };
}

function isProfilesTableMissing(message: string) {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("could not find the table 'public.profiles'") ||
    normalizedMessage.includes("relation \"public.profiles\" does not exist")
  );
}

export async function fetchProfileByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isProfilesTableMissing(error.message)) {
      if (!hasLoggedProfilesTableWarning) {
        hasLoggedProfilesTableWarning = true;
        console.warn(
          "[profiles] table not available in the connected Supabase project; falling back to auth-only session data."
        );
      }
      return null;
    }

    console.error("[profiles] fetch error", error.message);
    return null;
  }

  return normalizeProfileRow(data);
}
