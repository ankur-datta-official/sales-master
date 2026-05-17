import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buildCeoDashboardHref, parseCeoDashboardSearchParams } from "@/modules/dashboard/ceo-filters";
import { getDashboardData } from "@/modules/dashboard/service";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardExportPage({ searchParams }: PageProps) {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (role !== "admin") {
    redirect(ROUTES.dashboard);
  }

  const rawSearchParams = await searchParams;
  const filters = parseCeoDashboardSearchParams(rawSearchParams);
  const supabase = await createClient();
  const displayName = getUserDisplayName(profile, user);
  const dashboard = await getDashboardData({
    supabase,
    role,
    userId: profile?.id ?? user.id,
    userName: displayName,
    ceoFilters: filters,
  });

  return (
    <div className="space-y-4 print:space-y-3">
      <PageHeader
        title="CEO Export Summary"
        description={`Filtered executive summary for ${dashboard.filters.dateLabel}.`}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={buildCeoDashboardHref(ROUTES.dashboard, filters)}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Filter Summary</CardTitle>
          <CardDescription>These filters were used to generate the executive export snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Division</p>
            <p className="mt-2 text-sm font-medium">{dashboard.filters.scopeLabel.split("/")[0]?.trim() || "All divisions"}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Zone</p>
            <p className="mt-2 text-sm font-medium">{dashboard.filters.scopeLabel.split("/")[1]?.trim() || "All zones"}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Date Range</p>
            <p className="mt-2 text-sm font-medium">{dashboard.filters.dateLabel}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">View Type</p>
            <p className="mt-2 text-sm font-medium">{dashboard.filters.activeView}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.kpis.map((kpi) => (
          <Card key={kpi.key} className="py-0">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
              {kpi.hint ? <p className="text-xs text-muted-foreground">{kpi.hint}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target Progress</CardTitle>
          <CardDescription>Target vs achieved summary for the active executive scope.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {dashboard.progress.map((metric) => (
            <div key={metric.key} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">Target {metric.target}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{metric.actual}</p>
                  <p className="text-xs text-muted-foreground">{metric.percent}%</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {dashboard.sections.slice(0, 4).map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description ? <CardDescription>{section.description}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              {section.rows.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {section.emptyLabel}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        {section.columns.map((column) => (
                          <th
                            key={column.key}
                            className={cn(
                              "px-3 py-2 text-xs font-semibold text-muted-foreground",
                              column.align === "right" && "text-right"
                            )}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row) => (
                        <tr key={row.key} className="border-b last:border-0">
                          {section.columns.map((column) => {
                            const cell = row.cells.find((item) => item.key === column.key);
                            return (
                              <td
                                key={column.key}
                                className={cn(
                                  "px-3 py-2",
                                  column.align === "right" && "text-right",
                                  cell?.mono && "font-mono text-xs"
                                )}
                              >
                                {cell?.value ?? "-"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Summary</CardTitle>
          <CardDescription>Latest executive workflow alerts for the same filter scope.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.alerts.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No alerts found for this export scope.
            </p>
          ) : (
            dashboard.alerts.map((alert) => (
              <div key={alert.key} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  {alert.time ? <span className="text-xs text-muted-foreground">{alert.time}</span> : null}
                </div>
                {alert.detail ? <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

