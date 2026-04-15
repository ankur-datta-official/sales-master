export type TrackingStatus = "active" | "stale" | "no_recent_update";

export type ActiveFieldUserSummary = {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  role_name: string | null;
  role_slug: string | null;
  designation: string | null;
  attendance_session_id: string;
  check_in_at: string;
  session_status: "checked_in";
  last_ping_at: string | null;
  last_ping_lat: number | null;
  last_ping_lng: number | null;
  last_ping_accuracy: number | null;
  tracking_status: TrackingStatus;
};

export type FieldActivityTimelineItem = {
  id: string;
  type: "check_in" | "check_out" | "location_ping";
  at: string;
  title: string;
  description: string;
};

export type FieldActivitySessionDetail = {
  attendance_session_id: string;
  session_status: "checked_in" | "checked_out" | "missed_checkout";
  check_in_at: string;
  check_out_at: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
};

export type FieldActivityUserDetail = {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  role_name: string | null;
  role_slug: string | null;
  designation: string | null;
  tracking_status: TrackingStatus;
  session: FieldActivitySessionDetail;
  last_ping_at: string | null;
  last_ping_lat: number | null;
  last_ping_lng: number | null;
  last_ping_accuracy: number | null;
  recent_points: {
    id: string;
    captured_at: string;
    lat: number;
    lng: number;
    accuracy: number | null;
    source: string;
  }[];
  timeline: FieldActivityTimelineItem[];
};
