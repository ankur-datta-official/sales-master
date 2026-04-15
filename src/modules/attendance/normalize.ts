import type { AttendanceSessionStatus } from "@/constants/statuses";

import type { AttendanceSession, AttendanceSessionWithUser } from "@/modules/attendance/types";

type PersonShape = { full_name: string | null; email: string | null };

function pickPerson(value: PersonShape | PersonShape[] | null | undefined): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function toNum(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type RowBase = {
  id: string;
  organization_id: string;
  user_id: string;
  check_in_at: string;
  check_in_lat: unknown;
  check_in_lng: unknown;
  check_in_address: string | null;
  check_out_at: string | null;
  check_out_lat: unknown;
  check_out_lng: unknown;
  check_out_address: string | null;
  status: string;
  device_info: string;
  created_at: string;
  updated_at: string;
};

export function mapAttendanceSessionRow(row: RowBase): AttendanceSession {
  return {
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    check_in_at: row.check_in_at,
    check_in_lat: toNum(row.check_in_lat),
    check_in_lng: toNum(row.check_in_lng),
    check_in_address: row.check_in_address,
    check_out_at: row.check_out_at,
    check_out_lat: toNum(row.check_out_lat),
    check_out_lng: toNum(row.check_out_lng),
    check_out_address: row.check_out_address,
    status: row.status as AttendanceSessionStatus,
    device_info: row.device_info ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

type RowWithUser = RowBase & {
  owner: PersonShape | PersonShape[] | null;
};

export function mapAttendanceSessionWithUserRow(row: RowWithUser): AttendanceSessionWithUser {
  const base = mapAttendanceSessionRow(row);
  const owner = pickPerson(row.owner);
  return {
    ...base,
    user_name: owner?.full_name ?? null,
    user_email: owner?.email ?? null,
  };
}
