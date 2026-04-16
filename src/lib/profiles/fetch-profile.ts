import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserProfile } from "@/types/profile";

let hasLoggedProfilesTableWarning = false;

export const PROFILE_WITH_ROLE_SELECT =
  "id, email, full_name, avatar_url, status, phone, employee_code, designation, organization_id, branch_id, role_id, reports_to_user_id, is_field_user, joined_at, created_at, updated_at, roles ( slug, name, level )";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function roleSlugFromRow(row: Record<string, unknown>): string | null {
  const nested = row["roles"];
  if (isRecord(nested) && !Array.isArray(nested)) {
    return toNullableString(nested.slug);
  }
  if (Array.isArray(nested) && nested[0] && isRecord(nested[0])) {
    return toNullableString(nested[0].slug);
  }
  return toNullableString(row["role"]);
}

export function normalizeProfileRow(row: unknown): UserProfile | null {
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
    role: roleSlugFromRow(row),
    created_at: toNullableString(row.created_at),
    updated_at: toNullableString(row.updated_at),
  };
}

function isProfilesTableMissing(message: string) {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("could not find the table 'public.profiles'") ||
    normalizedMessage.includes('relation "public.profiles" does not exist')
  );
}

export async function fetchProfileByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_WITH_ROLE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isProfilesTableMissing(error.message)) {
      if (!hasLoggedProfilesTableWarning) {
        hasLoggedProfilesTableWarning = true;
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[profiles] table not available in the connected Supabase project; falling back to auth-only session data."
          );
        }
      }
      return null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("[profiles] fetch error", error.message);
    } else {
      console.error("[profiles] fetch error");
    }
    return null;
  }

  return normalizeProfileRow(data);
}
