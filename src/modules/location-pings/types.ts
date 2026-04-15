import type { LocationPingSource } from "@/constants/statuses";

export type LocationPing = {
  id: string;
  organization_id: string;
  attendance_session_id: string;
  user_id: string;
  captured_at: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  source: LocationPingSource;
  created_at: string;
};
