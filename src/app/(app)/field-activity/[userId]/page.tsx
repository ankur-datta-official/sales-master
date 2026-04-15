import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canViewFieldActivitySummary } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { fieldActivityDetailFiltersSchema } from "@/modules/field-activity/schemas";
import { getFieldActivityUserDetail } from "@/modules/field-activity/service";
import type { TrackingStatus } from "@/modules/field-activity/types";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{
    stale_minutes?: string;
    points_limit?: string;
    timeline_limit?: string;
  }>;
};

function trackingBadgeClass(status: TrackingStatus): string {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (status === "stale") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
}

function trackingLabel(status: TrackingStatus): string {
  if (status === "active") return "active";
  if (status === "stale") return "stale";
  return "no recent update";
}

export default async function FieldActivityDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { userId } = await params;
  const rawFilters = await searchParams;

  const parsedFilters = fieldActivityDetailFiltersSchema.safeParse({
    stale_minutes: rawFilters.stale_minutes,
    points_limit: rawFilters.points_limit,
    timeline_limit: rawFilters.timeline_limit,
  });
  const filters = parsedFilters.success
    ? parsedFilters.data
    : fieldActivityDetailFiltersSchema.parse({});

  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewFieldActivitySummary(role)) {
    redirect(ROUTES.dashboard);
  }

  const supabase = await createClient();
  const detailResult = await getFieldActivityUserDetail(supabase, userId, {
    staleMinutes: filters.stale_minutes,
    pointsLimit: filters.points_limit,
    timelineLimit: filters.timeline_limit,
  });

  if (!detailResult.ok) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Field activity detail</h1>
        <p className="text-destructive text-sm">Could not load user activity: {detailResult.error}</p>
      </div>
    );
  }

  const detail = detailResult.data;
  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.fieldActivity}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
        >
          ← Field activity
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Field activity detail</h1>
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="stale_minutes"
          type="number"
          min={1}
          max={240}
          defaultValue={filters.stale_minutes}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          placeholder="Stale after minutes"
        />
        <input
          name="points_limit"
          type="number"
          min={5}
          max={200}
          defaultValue={filters.points_limit}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          placeholder="Recent points limit"
        />
        <input
          name="timeline_limit"
          type="number"
          min={5}
          max={100}
          defaultValue={filters.timeline_limit}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          placeholder="Timeline limit"
        />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        >
          Apply
        </button>
      </form>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>User summary</CardTitle>
          <CardDescription>Active session preferred, otherwise most recent session shown.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">User</dt>
            <dd>{detail.user_name ?? detail.user_email ?? detail.user_id}</dd>
            <dt className="text-muted-foreground">Role / designation</dt>
            <dd>
              {detail.role_name ?? detail.role_slug ?? "—"}
              <span className="text-muted-foreground ml-2">{detail.designation ?? "—"}</span>
            </dd>
            <dt className="text-muted-foreground">Tracking</dt>
            <dd>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  trackingBadgeClass(detail.tracking_status)
                )}
              >
                {trackingLabel(detail.tracking_status)}
              </span>
            </dd>
            <dt className="text-muted-foreground">Session status</dt>
            <dd className="capitalize">{detail.session.session_status.replaceAll("_", " ")}</dd>
            <dt className="text-muted-foreground">Check-in</dt>
            <dd className="font-mono text-xs">{new Date(detail.session.check_in_at).toLocaleString()}</dd>
            <dt className="text-muted-foreground">Check-out</dt>
            <dd className="font-mono text-xs">
              {detail.session.check_out_at
                ? new Date(detail.session.check_out_at).toLocaleString()
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Last ping</dt>
            <dd className="font-mono text-xs">
              {detail.last_ping_at ? new Date(detail.last_ping_at).toLocaleString() : "—"}
            </dd>
            <dt className="text-muted-foreground">Last known location</dt>
            <dd className="font-mono text-xs">
              {detail.last_ping_lat != null && detail.last_ping_lng != null
                ? `${detail.last_ping_lat.toFixed(6)}, ${detail.last_ping_lng.toFixed(6)}${
                    detail.last_ping_accuracy != null
                      ? ` (±${Math.round(detail.last_ping_accuracy)}m)`
                      : ""
                  }`
                : "—"}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Recent location points</CardTitle>
          <CardDescription>Latest sampled points for the selected session.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.recent_points.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sampled location points found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-2 py-2 font-medium">Captured</th>
                    <th className="px-2 py-2 font-medium">Lat</th>
                    <th className="px-2 py-2 font-medium">Lng</th>
                    <th className="px-2 py-2 font-medium">Accuracy</th>
                    <th className="px-2 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.recent_points.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-2 py-2 font-mono text-xs">
                        {new Date(p.captured_at).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">{p.lat}</td>
                      <td className="px-2 py-2 font-mono text-xs">{p.lng}</td>
                      <td className="px-2 py-2 font-mono text-xs">
                        {p.accuracy != null ? Math.round(p.accuracy) : "—"}
                      </td>
                      <td className="px-2 py-2 capitalize">{p.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Activity timeline</CardTitle>
          <CardDescription>Simple chronological events for quick review.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity timeline events.</p>
          ) : (
            <ul className="space-y-2">
              {detail.timeline.map((item) => (
                <li key={item.id} className="rounded-md border p-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {new Date(item.at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
