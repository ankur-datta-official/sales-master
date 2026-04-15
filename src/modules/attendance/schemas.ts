import { z } from "zod";

const optionalCoord = z
  .number()
  .finite()
  .min(-180)
  .max(180)
  .optional();

const optionalLat = z
  .number()
  .finite()
  .min(-90)
  .max(90)
  .optional();

export const checkInAttendanceSchema = z.object({
  check_in_lat: optionalLat,
  check_in_lng: optionalCoord,
  check_in_address: z.string().max(4000).optional(),
  device_info: z.string().max(4000).optional(),
});

export type CheckInAttendanceInput = z.infer<typeof checkInAttendanceSchema>;

export const checkOutAttendanceSchema = z.object({
  check_out_lat: optionalLat,
  check_out_lng: optionalCoord,
  check_out_address: z.string().max(4000).optional(),
});

export type CheckOutAttendanceInput = z.infer<typeof checkOutAttendanceSchema>;
