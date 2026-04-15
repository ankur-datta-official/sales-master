"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkInAttendanceAction, checkOutAttendanceAction } from "@/modules/attendance/actions";
import type { AttendanceSession } from "@/modules/attendance/types";
import type { LocationPing } from "@/modules/location-pings/types";

type Props = {
  activeSession: AttendanceSession | null;
  canCheckInOut: boolean;
  lastKnownLocation: LocationPing | null;
};

function readDeviceInfo(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent?.slice(0, 2000) ?? "";
}

type GeoPoint = { lat: number; lng: number; accuracyMeters: number | null };

function getCurrentPosition(
  options: PositionOptions
): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      options
    );
  });
}

function toGeoPoint(pos: GeolocationPosition | null): GeoPoint | null {
  if (!pos) return null;
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyMeters: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
  };
}

function pickBestGeoPoint(candidates: Array<GeoPoint | null>): GeoPoint | null {
  const valid = candidates.filter((c): c is GeoPoint => c !== null);
  if (!valid.length) return null;
  return valid.reduce((best, current) => {
    const bestAcc = best.accuracyMeters ?? Number.POSITIVE_INFINITY;
    const curAcc = current.accuracyMeters ?? Number.POSITIVE_INFINITY;
    return curAcc < bestAcc ? current : best;
  });
}

async function tryGeolocation(): Promise<GeoPoint | null> {
  // First attempt: prefer fresh high-accuracy GPS fix.
  const precise = await getCurrentPosition({
    maximumAge: 0,
    timeout: 15000,
    enableHighAccuracy: true,
  });
  const first = toGeoPoint(precise);
  if (first?.accuracyMeters != null && first.accuracyMeters <= 30) {
    return first;
  }

  // Fallback: allow cached/network-assisted position and pick best result.
  const fallback = await getCurrentPosition({
    maximumAge: 120000,
    timeout: 10000,
    enableHighAccuracy: false,
  });
  return pickBestGeoPoint([first, toGeoPoint(fallback)]);
}

async function sendLocationPing(
  attendanceSessionId: string,
  geo: GeoPoint,
  source: "web" | "manual" = "web"
) {
  const res = await fetch("/api/location-pings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attendance_session_id: attendanceSessionId,
      lat: geo.lat,
      lng: geo.lng,
      accuracy: geo.accuracyMeters ?? undefined,
      source,
      captured_at: new Date().toISOString(),
    }),
  });
  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(json?.error ?? "Could not send location ping.");
  }
}

export function TodayAttendancePanel({ activeSession, canCheckInOut, lastKnownLocation }: Props) {
  const router = useRouter();
  const activeSessionId = activeSession?.id ?? null;
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [lastPingAt, setLastPingAt] = useState<string | null>(lastKnownLocation?.captured_at ?? null);
  const [isPending, startTransition] = useTransition();
  const pingInFlightRef = useRef(false);

  useEffect(() => {
    setLastPingAt(lastKnownLocation?.captured_at ?? null);
  }, [lastKnownLocation?.captured_at]);

  useEffect(() => {
    if (!activeSessionId || !canCheckInOut) {
      setTrackingStatus(null);
      return;
    }
    let mounted = true;
    const pingOnce = async () => {
      if (pingInFlightRef.current) return;
      pingInFlightRef.current = true;
      try {
        const geo = await tryGeolocation();
        if (!geo) {
          if (mounted) setTrackingStatus("Tracking waiting for GPS");
          return;
        }
        await sendLocationPing(activeSessionId, geo, "web");
        if (mounted) {
          const nowIso = new Date().toISOString();
          setLastPingAt(nowIso);
          setTrackingStatus("Tracking active");
        }
      } catch {
        if (mounted) setTrackingStatus("Tracking temporarily unavailable");
      } finally {
        pingInFlightRef.current = false;
      }
    };

    const firstTimeout = window.setTimeout(() => {
      void pingOnce();
    }, 8000);
    const interval = window.setInterval(() => {
      void pingOnce();
    }, 120000);

    return () => {
      mounted = false;
      window.clearTimeout(firstTimeout);
      window.clearInterval(interval);
    };
  }, [activeSessionId, canCheckInOut]);

  function onCheckIn() {
    setError(null);
    setHint(null);
    startTransition(async () => {
      const geo = await tryGeolocation();
      if (!geo) {
        setHint("Location not available; check-in will continue without coordinates.");
      } else if (geo.accuracyMeters != null && geo.accuracyMeters > 80) {
        setHint(
          `Weak GPS signal detected (~${Math.round(
            geo.accuracyMeters
          )}m). Saved location may be approximate.`
        );
      }
      const result = await checkInAttendanceAction({
        check_in_lat: geo?.lat,
        check_in_lng: geo?.lng,
        device_info: readDeviceInfo(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onCheckOut() {
    setError(null);
    setHint(null);
    startTransition(async () => {
      const geo = await tryGeolocation();
      if (!geo) {
        setHint("Location not available; check-out will continue without coordinates.");
      } else if (geo.accuracyMeters != null && geo.accuracyMeters > 80) {
        setHint(
          `Weak GPS signal detected (~${Math.round(
            geo.accuracyMeters
          )}m). Saved location may be approximate.`
        );
      }
      const result = await checkOutAttendanceAction({
        check_out_lat: geo?.lat,
        check_out_lng: geo?.lng,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTrackingStatus(null);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Today</CardTitle>
        <CardDescription>
          {canCheckInOut
            ? "Check in when you start work and check out when you finish. Location is optional."
            : "You do not have permission to change attendance from this account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}

        {activeSession ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Checked in</p>
            <p className="text-muted-foreground">
              Since{" "}
              <span className="font-mono text-xs">
                {new Date(activeSession.check_in_at).toLocaleString()}
              </span>
            </p>
            {activeSession.check_in_address ? (
              <p className="text-muted-foreground">{activeSession.check_in_address}</p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              {trackingStatus ?? "Tracking not started"}
              {lastPingAt ? (
                <>
                  {" "}
                  · last ping{" "}
                  <span className="font-mono">{new Date(lastPingAt).toLocaleTimeString()}</span>
                </>
              ) : null}
            </p>
            {canCheckInOut ? (
              <Button type="button" variant="secondary" disabled={isPending} onClick={onCheckOut}>
                {isPending ? "Checking out…" : "Check out"}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">You are not checked in.</p>
            {canCheckInOut ? (
              <Button type="button" disabled={isPending} onClick={onCheckIn}>
                {isPending ? "Checking in…" : "Check in"}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
