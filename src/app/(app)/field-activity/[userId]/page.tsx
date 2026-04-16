import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableTable,
} from "@/components/ui/data-table";
import { DetailHeader, DetailPageShell, KV, KeyValueGrid, MetadataCard, Section, StatusPill } from "@/components/ui/detail-page";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
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
  const actorProfileId = profile?.id;
  if (!actorProfileId) {
    redirect(ROUTES.login);
  }
  const role = resolveAppRole(user, profile);
  if (!canViewFieldActivitySummary(role)) {
    redirect(ROUTES.dashboard);
  }

  const supabase = await createClient();
  if (userId !== actorProfileId) {
    const canAccess = await rpcCanAccessProfile(supabase, actorProfileId, userId, role);
    if (!canAccess) {
      notFound();
    }
  }

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
    <DetailPageShell>
      <DetailHeader
        backHref={ROUTES.fieldActivity}
        backLabel="Field activity"
        title="Field activity detail"
        description="Operational tracking summary for a single user."
        badges={
          <>
            <StatusPill tone={detail.tracking_status === "active" ? "success" : detail.tracking_status === "stale" ? "warning" : "neutral"}>
              {trackingLabel(detail.tracking_status)}
            </StatusPill>
            <StatusPill tone="neutral">
              {detail.session.session_status.replaceAll("_", " ")}
            </StatusPill>
          </>
        }
      />

      <form>
        <FilterBar
          actions={
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
            >
              Apply filters
            </button>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              name="stale_minutes"
              type="number"
              min={1}
              max={240}
              defaultValue={filters.stale_minutes}
              placeholder="Stale after minutes"
            />
            <Input
              name="points_limit"
              type="number"
              min={5}
              max={200}
              defaultValue={filters.points_limit}
              placeholder="Recent points limit"
            />
            <Input
              name="timeline_limit"
              type="number"
              min={5}
              max={100}
              defaultValue={filters.timeline_limit}
              placeholder="Timeline limit"
            />
          </div>
        </FilterBar>
      </form>

      <MetadataCard
        className="max-w-3xl"
        title="User summary"
        description="Active session preferred, otherwise most recent session shown."
      >
        <KeyValueGrid columns="wide">
          <KV label="User" value={detail.user_name ?? detail.user_email ?? detail.user_id} />
          <KV
            label="Role / designation"
            value={
              <>
                {detail.role_name ?? detail.role_slug ?? "—"}
                <span className="ml-2 text-muted-foreground">{detail.designation ?? "—"}</span>
              </>
            }
          />
          <KV
            label="Tracking"
            value={
              <StatusBadge
                tone={
                  detail.tracking_status === "active"
                    ? "success"
                    : detail.tracking_status === "stale"
                      ? "warning"
                      : "neutral"
                }
                size="sm"
              >
                {trackingLabel(detail.tracking_status)}
              </StatusBadge>
            }
          />
          <KV label="Check-in" value={new Date(detail.session.check_in_at).toLocaleString()} mono />
          <KV
            label="Check-out"
            value={
              detail.session.check_out_at
                ? new Date(detail.session.check_out_at).toLocaleString()
                : "—"
            }
            mono
          />
          <KV label="Last ping" value={detail.last_ping_at ? new Date(detail.last_ping_at).toLocaleString() : "—"} mono />
          <KV
            label="Last known location"
            value={
              detail.last_ping_lat != null && detail.last_ping_lng != null
                ? `${detail.last_ping_lat.toFixed(6)}, ${detail.last_ping_lng.toFixed(6)}${
                    detail.last_ping_accuracy != null
                      ? ` (±${Math.round(detail.last_ping_accuracy)}m)`
                      : ""
                  }`
                : "—"
            }
            mono
          />
        </KeyValueGrid>
      </MetadataCard>

      <MetadataCard
        className="max-w-3xl"
        title="Recent location points"
        description="Latest sampled points for the selected session."
      >
        <DataTable label="Recent location points table">
          <DataTableTable className="min-w-[760px]">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Captured</DataTableHeaderCell>
                <DataTableHeaderCell>Lat</DataTableHeaderCell>
                <DataTableHeaderCell>Lng</DataTableHeaderCell>
                <DataTableHeaderCell align="right">Accuracy</DataTableHeaderCell>
                <DataTableHeaderCell>Source</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {detail.recent_points.length === 0 ? (
                <DataTableEmptyRow colSpan={5}>No sampled location points found.</DataTableEmptyRow>
              ) : (
                detail.recent_points.map((p) => (
                  <DataTableRow key={p.id}>
                    <DataTableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(p.captured_at).toLocaleString()}
                    </DataTableCell>
                    <DataTableCell className="font-mono text-xs">{p.lat}</DataTableCell>
                    <DataTableCell className="font-mono text-xs">{p.lng}</DataTableCell>
                    <DataTableCell align="right" className="font-mono text-xs">
                      {p.accuracy != null ? Math.round(p.accuracy) : "—"}
                    </DataTableCell>
                    <DataTableCell className="capitalize">{p.source}</DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTableTable>
        </DataTable>
      </MetadataCard>

      <MetadataCard
        className="max-w-3xl"
        title="Activity timeline"
        description="Simple chronological events for quick review."
      >
        {detail.timeline.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity timeline events.</p>
        ) : (
          <ul className="space-y-2">
            {detail.timeline.map((item) => (
              <li key={item.id} className="rounded-xl border bg-card/50 p-3 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium tracking-tight">{item.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {new Date(item.at).toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        )}
      </MetadataCard>
    </DetailPageShell>
  );
}
