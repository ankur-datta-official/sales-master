import { z } from "zod";

import { LOCATION_PING_SOURCES } from "@/constants/statuses";

const finiteNumber = z.number().finite();

export const createLocationPingSchema = z.object({
  attendance_session_id: z.string().uuid(),
  lat: finiteNumber.min(-90).max(90),
  lng: finiteNumber.min(-180).max(180),
  accuracy: finiteNumber.min(0).optional(),
  speed: finiteNumber.min(0).optional(),
  source: z.enum(LOCATION_PING_SOURCES).default("web"),
  captured_at: z.string().datetime().optional(),
});

export type CreateLocationPingInput = z.infer<typeof createLocationPingSchema>;

export const listSessionLocationPingsSchema = z.object({
  attendance_session_id: z.string().uuid(),
  limit: z.number().int().min(1).max(200).default(50),
});

export type ListSessionLocationPingsInput = z.infer<typeof listSessionLocationPingsSchema>;

export const getLastKnownLocationSchema = z.object({
  user_id: z.string().uuid(),
});

export type GetLastKnownLocationInput = z.infer<typeof getLastKnownLocationSchema>;
