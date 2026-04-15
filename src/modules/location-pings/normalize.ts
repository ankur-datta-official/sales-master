import type { LocationPingSource } from "@/constants/statuses";
import type { LocationPing } from "@/modules/location-pings/types";

type LocationPingRow = {
  id: string;
  organization_id: string;
  attendance_session_id: string;
  user_id: string;
  captured_at: string;
  lat: number | string;
  lng: number | string;
  accuracy: number | string | null;
  speed: number | string | null;
  source: string;
  created_at: string;
};

function toNumber(value: number | string | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapLocationPingRow(row: LocationPingRow): LocationPing {
  return {
    id: row.id,
    organization_id: row.organization_id,
    attendance_session_id: row.attendance_session_id,
    user_id: row.user_id,
    captured_at: row.captured_at,
    lat: toNumber(row.lat) ?? 0,
    lng: toNumber(row.lng) ?? 0,
    accuracy: toNumber(row.accuracy),
    speed: toNumber(row.speed),
    source: row.source as LocationPingSource,
    created_at: row.created_at,
  };
}
