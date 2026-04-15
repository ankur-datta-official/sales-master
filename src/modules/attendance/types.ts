import type { AttendanceSessionStatus } from "@/constants/statuses";

export type AttendanceSession = {
  id: string;
  organization_id: string;
  user_id: string;
  check_in_at: string;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_in_address: string | null;
  check_out_at: string | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_out_address: string | null;
  status: AttendanceSessionStatus;
  device_info: string;
  created_at: string;
  updated_at: string;
};

export type AttendanceSessionWithUser = AttendanceSession & {
  user_name: string | null;
  user_email: string | null;
};
