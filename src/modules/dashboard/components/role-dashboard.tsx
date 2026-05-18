import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  LineChart,
  Map,
  Package,
  Target,
  Truck,
  Users,
  WalletMinimal,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { CeoFilterControls } from "@/modules/dashboard/components/ceo-filter-controls";
import { getDashboardLayoutSpec } from "@/modules/dashboard/layout-spec";
import type {
  DashboardAction,
  DashboardAlert,
  DashboardIconKey,
  DashboardKpi,
  DashboardMiniStat,
  DashboardProgressMetric,
  DashboardTableSection,
  DashboardTrendPoint,
  RoleDashboardData,
} from "@/modules/dashboard/types";

const iconMap: Record<DashboardIconKey, ComponentType<{ className?: string }>> = {
  activity: Activity,
  alert: AlertTriangle,
  analytics: LineChart,
  approval: BadgeCheck,
  banknote: Banknote,
  bell: Bell,
  calendar: CalendarDays,
  check: CheckCircle2,
  customer: Users,
  delivery: Truck,
  document: FileText,
  package: Package,
  target: Target,
  team: Users,
  trend: LineChart,
  wallet: WalletMinimal,
};

const toneRing: Record<StatusTone, string> = {
  neutral: "bg-muted/70 text-foreground ring-foreground/10",
  info: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-300",
  success: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  danger: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-300",
};

function DashboardIcon({
  icon,
  tone = "neutral",
  className,
}: {
  icon: DashboardIconKey;
  tone?: StatusTone;
  className?: string;
}) {
  const Icon = iconMap[icon];
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1",
        toneRing[tone],
        className
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

function getCellValue(row: DashboardTableSection["rows"][number] | undefined, key: string) {
  return row?.cells.find((cell) => cell.key === key)?.value ?? "-";
}

function getCellTone(row: DashboardTableSection["rows"][number] | undefined, key: string): StatusTone {
  return row?.cells.find((cell) => cell.key === key)?.tone ?? "neutral";
}

function KpiTile({ item }: { item: DashboardKpi }) {
  const content = (
    <Card className="h-full py-0 shadow-[var(--shadow-sm)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.hint}</p>
            ) : null}
          </div>
          <DashboardIcon icon={item.icon} tone={item.tone ?? "neutral"} />
        </div>
        {typeof item.percent === "number" ? (
          <div className="mt-auto space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-primary",
                  item.tone === "success" && "bg-emerald-500",
                  item.tone === "warning" && "bg-amber-500",
                  item.tone === "danger" && "bg-rose-500"
                )}
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <p className="text-right text-xs font-semibold tabular-nums text-muted-foreground">
              {item.percent}%
            </p>
          </div>
        ) : item.detail ? (
          <p className="mt-auto text-xs text-muted-foreground">{item.detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!item.href) return content;
  return (
    <Link
      href={item.href}
      className="block h-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
    >
      {content}
    </Link>
  );
}

function ActionStrip({ actions }: { actions: DashboardAction[] }) {
  return (
    <Card className="py-0">
      <CardContent className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className="group flex min-h-16 items-center gap-3 rounded-xl border border-border/70 bg-background/45 px-3 py-2.5 transition-colors hover:bg-muted/50"
          >
            <DashboardIcon
              icon={action.icon}
              tone={action.tone ?? "neutral"}
              className="size-9 rounded-xl"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{action.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{action.hint}</span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function ProgressPanel({
  metrics,
  title = "Target vs Achievement",
  description = "This month in the current role scope.",
}: {
  metrics: DashboardProgressMetric[];
  title?: string;
  description?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {metrics.map((metric) => (
          <div key={metric.key} className="space-y-2">
            <div className="flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="font-medium">{metric.label}</p>
                <p className="text-xs text-muted-foreground">Target {metric.target}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">{metric.actual}</p>
                <p className="text-xs text-muted-foreground">{metric.percent}%</p>
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-primary",
                  metric.tone === "success" && "bg-emerald-500",
                  metric.tone === "warning" && "bg-amber-500",
                  metric.tone === "danger" && "bg-rose-500"
                )}
                style={{ width: `${metric.percent}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MiniStats({ stats, columns = "xl:grid-cols-5" }: { stats: DashboardMiniStat[]; columns?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", columns)}>
      {stats.map((stat) => (
        <Card key={stat.key} size="sm" className="py-0">
          <CardContent className="flex items-center gap-3 p-3">
            <DashboardIcon
              icon={stat.icon}
              tone={stat.tone ?? "neutral"}
              className="size-9 rounded-xl"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-semibold tabular-nums">{stat.value}</p>
              {stat.hint ? <p className="truncate text-xs text-muted-foreground">{stat.hint}</p> : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DataTableSection({ section }: { section: DashboardTableSection }) {
  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <CardTitle className="truncate">{section.title}</CardTitle>
          {section.description ? <CardDescription>{section.description}</CardDescription> : null}
        </div>
        {section.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7")}>
            {section.actionLabel ?? "View"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-xl border border-border/75">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-muted/45">
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
              {section.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={section.columns.length}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    {section.emptyLabel}
                  </td>
                </tr>
              ) : (
                section.rows.map((row) => (
                  <tr key={row.key} className="border-b last:border-0 hover:bg-muted/35">
                    {section.columns.map((column) => {
                      const cell = row.cells.find((item) => item.key === column.key);
                      const content = cell?.tone ? (
                        <StatusBadge tone={cell.tone} size="sm">
                          {cell.value}
                        </StatusBadge>
                      ) : (
                        <span className="line-clamp-1">{cell?.value ?? "-"}</span>
                      );

                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "px-3 py-2 align-middle",
                            column.align === "right" && "text-right",
                            cell?.mono && "font-mono text-xs"
                          )}
                        >
                          {row.href ? <Link href={row.href} className="block">{content}</Link> : content}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertList({ alerts, compact = false }: { alerts: DashboardAlert[]; compact?: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
        <CardDescription>Important live workflow signals.</CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-2", compact && "space-y-3")}>
        {alerts.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No alerts for the current scope.
          </p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.key} className="flex items-start gap-3 rounded-xl border bg-background/45 p-3">
              <DashboardIcon
                icon={alert.tone === "danger" ? "alert" : "bell"}
                tone={alert.tone ?? "neutral"}
                className="size-8 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{alert.title}</p>
                {alert.detail ? <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p> : null}
              </div>
              {alert.time ? <span className="shrink-0 text-xs text-muted-foreground">{alert.time}</span> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TrendPanel({ dashboard }: { dashboard: RoleDashboardData }) {
  const maxValue = Math.max(1, ...dashboard.trend.map((point) => Math.max(point.sales, point.collections)));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sales & Collection Trend</CardTitle>
        <CardDescription>Recent daily totals in the current scope.</CardDescription>
      </CardHeader>
      <CardContent>
        {dashboard.trend.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No trend points found for this month.
          </p>
        ) : (
          <div className="flex h-44 items-end gap-2">
            {dashboard.trend.map((point) => (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <span
                    className="w-2 rounded-t bg-emerald-500"
                    style={{ height: `${Math.max(4, (point.sales / maxValue) * 100)}%` }}
                  />
                  <span
                    className="w-2 rounded-t bg-blue-500"
                    style={{ height: `${Math.max(4, (point.collections / maxValue) * 100)}%` }}
                  />
                </div>
                <span className="truncate text-[0.65rem] text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterBand({ dashboard }: { dashboard: RoleDashboardData }) {
  if (!dashboard.filters.show) return null;

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-background/45 px-3 py-2">
            <p className="text-[0.7rem] font-semibold text-muted-foreground">Date Range</p>
            <p className="text-sm font-medium">{dashboard.filters.dateLabel}</p>
          </div>
          <div className="rounded-xl border bg-background/45 px-3 py-2">
            <p className="text-[0.7rem] font-semibold text-muted-foreground">Scope</p>
            <p className="text-sm font-medium">{dashboard.filters.scopeLabel}</p>
          </div>
          <div className="rounded-xl border bg-background/45 px-3 py-2">
            <p className="text-[0.7rem] font-semibold text-muted-foreground">View Type</p>
            <p className="text-sm font-medium">{dashboard.filters.activeView}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {dashboard.filters.viewTabs.map((tab) => (
            <span
              key={tab}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold",
                tab === dashboard.filters.activeView
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "bg-background/45 text-muted-foreground"
              )}
            >
              {tab}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Hero({ dashboard }: { dashboard: RoleDashboardData }) {
  const layoutSpec = getDashboardLayoutSpec(dashboard.variant);
  return (
    <section className="rounded-2xl border bg-card/88 p-4 shadow-[var(--shadow-md)] md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="info">{dashboard.variant.replaceAll("_", " ")}</StatusBadge>
            <StatusBadge tone="neutral">{dashboard.dateLabel}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{dashboard.greeting}</h1>
          <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <Link href={dashboard.primaryCtaHref} className={cn(buttonVariants({ variant: "outline" }), "h-9")}>
          <LineChart className="size-4" />
          {layoutSpec.primaryCtaLabel}
        </Link>
      </div>
    </section>
  );
}

function BudgetDial({ metrics }: { metrics: DashboardProgressMetric[] }) {
  const primaryPercent = metrics.length
    ? Math.round(metrics.reduce((sum, metric) => sum + metric.percent, 0) / metrics.length)
    : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>Target utilization inspired by the reference marketer view.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="flex justify-center">
          <div
            className="grid size-44 place-items-center rounded-full"
            style={{
              background: `conic-gradient(rgb(34 197 94) 0 ${primaryPercent}%, rgba(148, 163, 184, 0.2) ${primaryPercent}% 100%)`,
            }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-background shadow-[var(--shadow-sm)]">
              <div className="text-center">
                <p className="text-3xl font-semibold">{primaryPercent}%</p>
                <p className="text-xs text-muted-foreground">Utilized</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.key} className="rounded-xl border bg-background/45 px-3 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{metric.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{metric.actual}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Target {metric.target}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDonut({ stats, title, description }: { stats: DashboardMiniStat[]; title: string; description: string }) {
  const total = stats.reduce((sum, stat) => sum + Number(stat.value.replace(/[^\d.-]/g, "")), 0);
  const segments = stats.slice(0, 4);
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#f43f5e"];
  const stops = segments.reduce<string[]>((acc, stat, index) => {
    const previousEnd = acc.length === 0
      ? 0
      : Number.parseFloat(acc[acc.length - 1].split(" ").at(-1)?.replace("%", "") ?? "0");
    const value = Number(stat.value.replace(/[^\d.-]/g, "")) || 0;
    const share = total > 0 ? (value / total) * 100 : 0;
    const end = previousEnd + share;
    acc.push(`${colors[index]} ${previousEnd}% ${end}%`);
    return acc;
  }, []);

  return (
    <Card className="h-full min-h-[240px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex justify-center">
          <div
            className="grid size-44 place-items-center rounded-full shadow-[inset_0_10px_26px_rgba(255,255,255,0.28)]"
            style={{
              background: stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "rgba(148, 163, 184, 0.2)",
            }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-background shadow-[var(--shadow-sm)]">
              <div className="text-center">
                <p className="text-3xl font-semibold tabular-nums">{fmtCompactValue(total)}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {segments.map((stat, index) => (
            <div key={stat.key} className="flex items-center justify-between gap-3 rounded-2xl border bg-background/55 px-4 py-3 shadow-[var(--shadow-xs)]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[index] }} />
                <span className="truncate text-sm font-medium">{stat.label}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function parseDisplayNumber(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildLinePath(points: number[], width: number, height: number) {
  if (points.length === 0) return "";

  const maxValue = Math.max(...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(linePath: string, width: number, height: number) {
  if (!linePath) return "";
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

function trendDeltaLabel(points: number[]) {
  if (points.length < 2) return { label: "Stable", tone: "neutral" as StatusTone };

  const first = points[0] ?? 0;
  const last = points.at(-1) ?? 0;
  if (!first && !last) return { label: "Flat activity", tone: "neutral" as StatusTone };

  const delta = first > 0 ? ((last - first) / first) * 100 : last > 0 ? 100 : 0;
  const rounded = Math.abs(delta).toFixed(1);
  if (delta > 1) return { label: `Up ${rounded}%`, tone: "success" as StatusTone };
  if (delta < -1) return { label: `Down ${rounded}%`, tone: "danger" as StatusTone };
  return { label: "Stable", tone: "neutral" as StatusTone };
}

function ExecutiveKpiTile({ item }: { item: DashboardKpi }) {
  const ringPercent = Math.max(0, Math.min(100, item.percent ?? 0));
  const ringColor =
    item.tone === "success"
      ? "#22c55e"
      : item.tone === "warning"
        ? "#f59e0b"
        : item.tone === "danger"
          ? "#f43f5e"
          : "#3b82f6";
  const surface = (
    <Card className="h-full overflow-hidden border-border/70 bg-card/95 py-0 shadow-[var(--shadow-xs)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]">
      <CardContent className="relative flex h-full min-h-32 flex-col gap-3 p-3.5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${ringColor} 0%, transparent 100%)` }}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold leading-4 text-muted-foreground/90">{item.label}</p>
            <p className="mt-1.5 text-[1.65rem] font-semibold tracking-tight tabular-nums">{item.value}</p>
            {item.hint ? <p className="mt-1 text-[0.7rem] text-muted-foreground">{item.hint}</p> : null}
          </div>
          {typeof item.percent === "number" ? (
            <div
              className="grid size-14 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${ringColor} 0 ${ringPercent}%, rgba(148, 163, 184, 0.16) ${ringPercent}% 100%)`,
              }}
            >
              <div className="grid size-10 place-items-center rounded-full bg-background/95 text-[0.7rem] font-semibold tabular-nums text-foreground shadow-[var(--shadow-sm)]">
                {ringPercent}%
              </div>
            </div>
          ) : (
            <DashboardIcon icon={item.icon} tone={item.tone ?? "neutral"} className="size-10 rounded-2xl" />
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-[0.64rem] font-semibold",
              item.tone === "success" && "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
              item.tone === "warning" && "bg-amber-500/12 text-amber-700 dark:text-amber-300",
              item.tone === "danger" && "bg-rose-500/12 text-rose-600 dark:text-rose-300",
              (!item.tone || item.tone === "info") && "bg-blue-500/12 text-blue-600 dark:text-blue-300"
            )}
          >
            {item.detail ?? (typeof item.percent === "number" ? `${ringPercent}% completion` : "Live overview")}
          </span>
          <DashboardIcon icon={item.icon} tone={item.tone ?? "neutral"} className="size-8 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );

  if (!item.href) return surface;
  return (
    <Link href={item.href} className="block h-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45">
      {surface}
    </Link>
  );
}

function CeoHero({ dashboard }: { dashboard: RoleDashboardData }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[1.85rem] font-semibold tracking-tight text-foreground">{dashboard.greeting}</h1>
            <Info className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-0.5 max-w-4xl text-[0.92rem] text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <Link
          href={dashboard.primaryCtaHref}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 rounded-xl border-border/70 px-4 text-sm font-semibold shadow-[var(--shadow-xs)]"
          )}
        >
          <LineChart className="size-4" />
          Export Report
        </Link>
      </div>
    </section>
  );
}

function CeoFilterBand({ dashboard }: { dashboard: RoleDashboardData }) {
  return <CeoFilterControls filters={dashboard.filters} />;
}

function ExecutiveActionStrip({ actions }: { actions: DashboardAction[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {actions.map((action) => (
        <Link
          key={action.key}
          href={action.href}
          className="group flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-[var(--shadow-xs)] transition-colors hover:bg-muted/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <DashboardIcon icon={action.icon} tone={action.tone ?? "neutral"} className="size-10 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{action.label}</p>
              <p className="truncate text-xs text-muted-foreground">{action.hint}</p>
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}

function ExecutiveLineChart({ trend }: { trend: DashboardTrendPoint[] }) {
  const width = 560;
  const height = 180;
  const salesPoints = trend.map((point) => point.sales);
  const collectionPoints = trend.map((point) => point.collections);
  const salesPath = buildLinePath(salesPoints, width, height);
  const collectionPath = buildLinePath(collectionPoints, width, height);
  const salesArea = buildAreaPath(salesPath, width, height);
  const collectionArea = buildAreaPath(collectionPath, width, height);
  const salesDelta = trendDeltaLabel(salesPoints);
  const collectionDelta = trendDeltaLabel(collectionPoints);

  return (
    <Card className="h-full overflow-hidden border-border/75">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Sales & Collection Trend</CardTitle>
          <CardDescription>Monthly executive momentum with a cleaner chart-focused presentation.</CardDescription>
        </div>
        <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
          Monthly
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {trend.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No trend points found for this month.
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border bg-emerald-500/[0.06] px-3 py-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Sales</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{fmtCompactValue(salesPoints.at(-1) ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{salesDelta.label}</p>
              </div>
              <div className="rounded-2xl border bg-blue-500/[0.06] px-3 py-2">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Collections</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{fmtCompactValue(collectionPoints.at(-1) ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{collectionDelta.label}</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-background/55 p-3">
              <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-56 w-full">
                <defs>
                  <linearGradient id="ceo-sales-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="ceo-collections-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((ratio) => (
                  <line
                    key={ratio}
                    x1="0"
                    y1={height - height * ratio}
                    x2={width}
                    y2={height - height * ratio}
                    stroke="currentColor"
                    strokeOpacity="0.09"
                    strokeDasharray="6 6"
                  />
                ))}
                {salesArea ? <path d={salesArea} fill="url(#ceo-sales-gradient)" /> : null}
                {collectionArea ? <path d={collectionArea} fill="url(#ceo-collections-gradient)" /> : null}
                {salesPath ? <path d={salesPath} fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
                {collectionPath ? <path d={collectionPath} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
                {trend.map((point, index) => {
                  const x = trend.length > 1 ? (index * width) / (trend.length - 1) : width / 2;
                  return (
                    <text
                      key={point.label}
                      x={x}
                      y={height + 18}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px]"
                    >
                      {point.label}
                    </text>
                  );
                })}
              </svg>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                Sales
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-blue-500" />
                Collections
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function fmtCompactValue(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function fmtMoneyDisplay(value: number) {
  return `Tk ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)}`;
}

function ExecutiveGrowthStrip({ dashboard, href }: { dashboard: RoleDashboardData; href?: string }) {
  const salesSeries = dashboard.trend.map((point) => point.sales);
  const collectionSeries = dashboard.trend.map((point) => point.collections);
  const growthCards = [
    {
      key: "sales-growth",
      label: "Sales Growth",
      value: dashboard.kpis[0]?.value ?? "Tk 0",
      tone: "success" as StatusTone,
      points: salesSeries,
      color: "#22c55e",
    },
    {
      key: "collection-growth",
      label: "Collection Growth",
      value: dashboard.kpis[1]?.value ?? "Tk 0",
      tone: "info" as StatusTone,
      points: collectionSeries,
      color: "#2563eb",
    },
    {
      key: "customer-growth",
      label: "Customer Exposure",
      value: dashboard.miniStats[0]?.value ?? "0",
      tone: "warning" as StatusTone,
      points: salesSeries.map((point, index) => point + (collectionSeries[index] ?? 0) * 0.4),
      color: "#f97316",
    },
    {
      key: "profitability",
      label: "Delivery Rhythm",
      value: dashboard.kpis[4]?.value ?? dashboard.miniStats.at(-1)?.value ?? "0",
      tone: "danger" as StatusTone,
      points: collectionSeries.map((point, index) => Math.max(point - (salesSeries[index] ?? 0) * 0.15, 0)),
      color: "#8b5cf6",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>12. Company Growth Snapshot</CardTitle>
          <CardDescription>Executive quick-glance micro trends inspired by the CEO reference board.</CardDescription>
        </div>
        <Link href={href ?? "/analytics"} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View Growth Report
        </Link>
      </CardHeader>
      <CardContent className="grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-4">
        {growthCards.map((card) => (
          <SparkGrowthCard key={card.key} label={card.label} value={card.value} points={card.points} color={card.color} tone={card.tone} />
        ))}
      </CardContent>
    </Card>
  );
}

function SparkGrowthCard({
  label,
  value,
  points,
  color,
  tone,
}: {
  label: string;
  value: string;
  points: number[];
  color: string;
  tone: StatusTone;
}) {
  const width = 140;
  const height = 40;
  const path = buildLinePath(points.length > 0 ? points : [0], width, height);
  const delta = trendDeltaLabel(points);

  return (
    <div className="rounded-2xl border bg-background/55 p-3 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <StatusBadge tone={tone}>{delta.label}</StatusBadge>
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-12 w-full">
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ExecutiveSummaryTiles({ stats }: { stats: DashboardMiniStat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.slice(0, 4).map((stat) => (
        <div key={stat.key} className="rounded-2xl border bg-background/55 p-3 shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
            <DashboardIcon icon={stat.icon} tone={stat.tone ?? "neutral"} className="size-8 rounded-xl" />
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{stat.value}</p>
          {stat.hint ? <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

function ExecutiveDivisionRankCard({ section }: { section?: DashboardTableSection }) {
  if (!section) return null;

  const sorted = [...section.rows].sort((left, right) => {
    const leftValue = parseDisplayNumber(left.cells.find((cell) => cell.key === "achievement")?.value ?? "0");
    const rightValue = parseDisplayNumber(right.cells.find((cell) => cell.key === "achievement")?.value ?? "0");
    return rightValue - leftValue;
  });
  const topRows = sorted.slice(0, 3);
  const lowRows = sorted.slice(-3).reverse();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>5. Top & Low Performing Divisions</CardTitle>
        <CardDescription>This month's strongest and weakest branch clusters.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">Top Performing</p>
          {topRows.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{section.emptyLabel}</p>
          ) : (
            topRows.map((row, index) => (
              <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{index + 1}. {row.cells[0]?.value ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">{row.cells[4]?.value ?? "On Track"}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">{row.cells[3]?.value ?? "-"}</span>
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">Low Performing</p>
          {lowRows.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{section.emptyLabel}</p>
          ) : (
            lowRows.map((row, index) => (
              <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{index + 1}. {row.cells[0]?.value ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">{row.cells[4]?.value ?? "Critical"}</p>
                </div>
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-300">{row.cells[3]?.value ?? "-"}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutivePerformanceCard({
  section,
  title,
  description,
}: {
  section?: DashboardTableSection;
  title: string;
  description: string;
}) {
  if (!section) return null;

  const rows = section.rows.slice(0, 5);

  return (
    <Card className="h-full min-h-[248px]">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <CardTitle className="truncate">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {section.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {section.actionLabel ?? "View All"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{section.emptyLabel}</p>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.72fr))_minmax(0,0.92fr)] gap-2 rounded-xl bg-muted/35 px-3 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>{section.columns[0]?.label ?? "Division / Zone"}</span>
              <span className="text-center">{section.columns[1]?.label ?? "Sales"}</span>
              <span className="text-center">{section.columns[2]?.label ?? "Collections"}</span>
              <span className="text-center">{section.columns[3]?.label ?? "Ach."}</span>
              <span className="text-right">{section.columns[4]?.label ?? "Status"}</span>
            </div>
            <div className="space-y-2">
              {rows.map((row) => {
                const name = row.cells[0]?.value ?? "-";
                const sales = row.cells[1]?.value ?? "-";
                const collections = row.cells[2]?.value ?? "-";
                const achievement = row.cells[3]?.value ?? "-";
                const status = row.cells[4]?.value ?? "-";
                const statusTone = row.cells[4]?.tone ?? "neutral";
                const rowBody = (
                  <div className="rounded-xl border bg-background/55 px-3 py-2.5 shadow-[var(--shadow-xs)]">
                    <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.72fr))_minmax(0,0.92fr)] items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">Current scope</p>
                      </div>
                      <span className="text-center font-mono text-xs tabular-nums text-muted-foreground">{sales}</span>
                      <span className="text-center font-mono text-xs tabular-nums text-muted-foreground">{collections}</span>
                      <span className="text-center font-mono text-xs font-semibold tabular-nums">{achievement}</span>
                      <div className="flex justify-end">
                        <StatusBadge tone={statusTone} size="sm">
                          {status}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                );

                return row.href ? (
                  <Link key={row.key} href={row.href} className="block">
                    {rowBody}
                  </Link>
                ) : (
                  <div key={row.key}>{rowBody}</div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ExecutiveOutstandingCard({
  section,
  title,
  description,
}: {
  section?: DashboardTableSection;
  title?: string;
  description?: string;
}) {
  if (!section) return null;

  const topRows = section.rows.slice(0, 5);
  const totalValue = topRows.reduce((sum, row) => {
    const amountCell = row.cells.find((cell) => cell.key.toLowerCase().includes("amount") || cell.key.toLowerCase().includes("open"));
    return sum + parseDisplayNumber(amountCell?.value ?? "0");
  }, 0);

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title ?? section.title}</CardTitle>
          <CardDescription>{description ?? section.description ?? "Open due positions from visible customers."}</CardDescription>
        </div>
        <span className="rounded-full border bg-rose-500/8 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
          {fmtCompactValue(totalValue)}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {topRows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{section.emptyLabel}</p>
        ) : (
          topRows.map((row) => {
            const label = row.cells[0]?.value ?? "-";
            const amount = row.cells.find((cell) => cell.key.toLowerCase().includes("amount") || cell.key.toLowerCase().includes("open"))?.value ?? "-";
            const aging = row.cells.at(-1)?.value ?? "-";
            return (
              <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{aging}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-300">{amount}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function MarketerHero({ dashboard }: { dashboard: RoleDashboardData }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.9rem] font-semibold tracking-tight">{dashboard.greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <div className="inline-flex h-12 items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 shadow-[var(--shadow-xs)]">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{dashboard.filters.dateLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}

function MarketerKpiTile({ item }: { item: DashboardKpi }) {
  const ringPercent = Math.max(0, Math.min(100, item.percent ?? 0));
  const ringColor =
    item.tone === "success"
      ? "#22c55e"
      : item.tone === "warning"
        ? "#f59e0b"
        : item.tone === "danger"
          ? "#f43f5e"
          : "#8b5cf6";
  const accentBg =
    item.tone === "success"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : item.tone === "warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : item.tone === "danger"
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
          : "bg-violet-500/10 text-violet-600 dark:text-violet-300";
  const ctaLabel =
    item.key === "sales-target" || item.key === "collection-target"
      ? "View Target"
      : "View Details";

  const content = (
    <Card className="h-full border-border/70 bg-card/95 py-0 shadow-[var(--shadow-xs)]">
      <CardContent className="flex h-full min-h-32 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.94rem] font-semibold text-foreground/90">{item.label}</p>
            <p className="mt-2 text-[1.85rem] font-semibold tracking-tight tabular-nums">{item.value}</p>
          </div>
          {typeof item.percent === "number" ? (
            <div
              className="grid size-14 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${ringColor} 0 ${ringPercent}%, rgba(148, 163, 184, 0.16) ${ringPercent}% 100%)`,
              }}
            >
              <div className="grid size-10 place-items-center rounded-full bg-background text-[0.72rem] font-semibold tabular-nums">
                {ringPercent}%
              </div>
            </div>
          ) : (
            <span className={cn("grid size-12 place-items-center rounded-2xl", accentBg)}>
              <DashboardIcon icon={item.icon} tone={item.tone ?? "neutral"} className="size-12 rounded-2xl bg-transparent ring-0" />
            </span>
          )}
        </div>
        {item.hint ? <p className="text-sm text-muted-foreground">{item.hint}</p> : null}
        <div className={cn("mt-auto rounded-xl border px-3 py-2 text-center text-sm font-semibold", accentBg)}>
          {ctaLabel}
        </div>
      </CardContent>
    </Card>
  );

  if (!item.href) return content;
  return <Link href={item.href} className="block h-full">{content}</Link>;
}

function MarketerActionStrip({ actions }: { actions: DashboardAction[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {actions.map((action) => (
        <Link
          key={action.key}
          href={action.href}
          className="flex min-h-20 items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-[var(--shadow-xs)] transition-colors hover:bg-muted/35"
        >
          <DashboardIcon icon={action.icon} tone={action.tone ?? "neutral"} className="size-10 rounded-xl" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{action.label}</p>
            <p className="truncate text-xs text-muted-foreground">{action.hint}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MarketerTodayPlanCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Today's Plan</CardTitle>
          <CardDescription>Customer visits lined up for the day.</CardDescription>
        </div>
        <span className="text-sm font-semibold text-primary">{rows.length} Visits Planned</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No visit plans found."}
          </p>
        ) : (
          rows.map((row) => {
            const date = row.cells.find((cell) => cell.key === "date")?.value ?? "-";
            const customer = row.cells.find((cell) => cell.key === "customer")?.value ?? "-";
            const purpose = row.cells.find((cell) => cell.key === "purpose")?.value ?? "-";
            const status = row.cells.find((cell) => cell.key === "status");
            return (
              <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{date}</p>
                  <p className="truncate text-sm">{customer}</p>
                  <p className="text-xs text-muted-foreground">{purpose}</p>
                </div>
                <StatusBadge tone={status?.tone ?? "info"} size="sm">
                  {status?.value ?? "Visit"}
                </StatusBadge>
              </div>
            );
          })
        )}
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-xl")}>
            {section.actionLabel ?? "View Full Plan"}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MarketerTargetCard({
  dashboard,
  orders,
}: {
  dashboard: RoleDashboardData;
  orders?: DashboardTableSection;
}) {
  const statTiles = dashboard.miniStats.slice(0, 4);

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Target vs Achievement</CardTitle>
          <CardDescription>This month</CardDescription>
        </div>
        <Link href="/analytics" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View Full Report
        </Link>
      </CardHeader>
      <CardContent className="space-y-5">
        {dashboard.progress.map((metric) => (
          <div key={metric.key} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="text-xs text-muted-foreground">{metric.target}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{metric.actual}</p>
                <p className="text-xs text-muted-foreground">{metric.percent}%</p>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  metric.key === "sales" ? "bg-green-500" : "bg-violet-500"
                )}
                style={{ width: `${metric.percent}%` }}
              />
            </div>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statTiles.map((stat) => (
            <div key={stat.key} className="rounded-2xl border bg-background/55 p-3">
              <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{stat.value}</p>
              {stat.hint ? <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MarketerOrderListCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];
  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest order activity.</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {section.actionLabel ?? "View All"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No recent orders found."}
          </p>
        ) : (
          rows.map((row) => {
            const order = row.cells.find((cell) => cell.key === "order")?.value ?? "-";
            const customer = row.cells.find((cell) => cell.key === "customer")?.value ?? "-";
            const amount = row.cells.find((cell) => cell.key === "amount")?.value ?? "-";
            const status = row.cells.find((cell) => cell.key === "status");
            return (
              <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold">{order}</p>
                  <p className="truncate text-sm text-muted-foreground">{customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{amount}</p>
                  <StatusBadge tone={status?.tone ?? "neutral"} size="sm">
                    {status?.value ?? "-"}
                  </StatusBadge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function MarketerBudgetCard({ dashboard }: { dashboard: RoleDashboardData }) {
  const totalBudget = dashboard.progress.reduce((sum, metric) => sum + parseDisplayNumber(metric.target), 0);
  const utilized = dashboard.progress.reduce((sum, metric) => sum + parseDisplayNumber(metric.actual), 0);
  const remaining = Math.max(totalBudget - utilized, 0);
  const percentUsed = totalBudget > 0 ? Math.round((utilized / totalBudget) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>This month</CardDescription>
        </div>
        <Link href="/monthly-budget" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View Budget
        </Link>
      </CardHeader>
      <CardContent className="grid min-h-[270px] gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <div
            className="grid size-44 place-items-center rounded-full shadow-[inset_0_8px_24px_rgba(255,255,255,0.35)] lg:size-48"
            style={{
              background: `conic-gradient(#22c55e 0 ${percentUsed}%, rgba(148, 163, 184, 0.16) ${percentUsed}% 100%)`,
            }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-background shadow-[var(--shadow-sm)] lg:size-32">
              <div className="text-center">
                <p className="text-3xl font-semibold">{percentUsed}%</p>
                <p className="text-xs text-muted-foreground">Utilized</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border bg-background/55 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total Budget</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{fmtMoneyDisplay(totalBudget)}</p>
          </div>
          <div className="rounded-2xl border bg-emerald-500/[0.06] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Utilized</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-300">{fmtMoneyDisplay(utilized)}</p>
          </div>
          <div className="rounded-2xl border bg-rose-500/[0.06] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Remaining</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-300">{fmtMoneyDisplay(remaining)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketerFollowUpCard({ dashboard }: { dashboard: RoleDashboardData }) {
  const stats = [
    { key: "overdue", label: "Overdue Follow-ups", value: dashboard.miniStats.find((item) => item.key === "pending-followups")?.value ?? "0", tone: "danger" as StatusTone },
    { key: "today", label: "Today's Follow-ups", value: dashboard.miniStats.find((item) => item.key === "today-visits")?.value ?? "0", tone: "warning" as StatusTone },
    { key: "upcoming", label: "Upcoming Follow-ups", value: dashboard.miniStats.find((item) => item.key === "pending-orders")?.value ?? "0", tone: "info" as StatusTone },
    { key: "completed", label: "Completed Follow-ups", value: String(dashboard.alerts.filter((alert) => alert.tone === "success").length), tone: "success" as StatusTone },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Follow-up Summary</CardTitle>
          <CardDescription>Across current workload</CardDescription>
        </div>
        <Link href="/notifications" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
              stat.tone === "danger" && "bg-rose-500/[0.05]",
              stat.tone === "warning" && "bg-amber-500/[0.05]",
              stat.tone === "info" && "bg-blue-500/[0.05]",
              stat.tone === "success" && "bg-emerald-500/[0.05]"
            )}
          >
            <p className="text-sm font-medium">{stat.label}</p>
            <span className="text-2xl font-semibold tabular-nums">{stat.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MarketerNotificationsCard({ alerts }: { alerts: DashboardAlert[] }) {
  const items = alerts.slice(0, 2);
  const fallbackItems: DashboardAlert[] = [
    {
      key: "marketer-fallback-order",
      title: "Pending order approval needs follow-up.",
      detail: "Check the latest submitted demand order and coordinate with accounts if required.",
      time: "Smart reminder",
      tone: "warning",
    },
    {
      key: "marketer-fallback-collection",
      title: "Recent collection entry has been recorded.",
      detail: "Review the last customer payment update and prepare the next visit touchpoint.",
      time: "Smart reminder",
      tone: "info",
    },
  ];
  const displayItems =
    items.length >= 2
      ? items.slice(0, 2)
      : [...items, ...fallbackItems.filter((fallback) => !items.some((item) => item.key === fallback.key))].slice(0, 2);

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Latest work updates</CardDescription>
        </div>
        <Link href="/notifications" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayItems.map((alert) => (
            <div key={alert.key} className="flex items-start gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <span className={cn(
                "mt-1 size-2 rounded-full",
                alert.tone === "danger" && "bg-rose-500",
                alert.tone === "warning" && "bg-amber-500",
                alert.tone === "success" && "bg-emerald-500",
                (!alert.tone || alert.tone === "info" || alert.tone === "neutral") && "bg-blue-500"
              )} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{alert.title}</p>
                {alert.detail ? <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p> : null}
              </div>
              {alert.time ? <span className="shrink-0 text-xs text-muted-foreground">{alert.time}</span> : null}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

function CompactExecutiveListCard({
  section,
  title,
  description,
  actionLabel,
}: {
  section?: DashboardTableSection;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  if (!section) return null;

  const rows = section.rows.slice(0, 4);

  return (
    <Card className="h-full min-h-[316px]">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {section.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {actionLabel ?? section.actionLabel ?? "View All"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{section.emptyLabel}</p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.cells[0]?.value ?? "-"}</p>
                <p className="truncate text-xs text-muted-foreground">{row.cells[2]?.value ?? row.cells[1]?.value ?? "-"}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{row.cells[1]?.value ?? "-"}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ZoneManagerHero({ dashboard }: { dashboard: RoleDashboardData }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.9rem] font-semibold tracking-tight">{dashboard.greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <div className="inline-flex h-12 items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 shadow-[var(--shadow-xs)]">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{dashboard.filters.dateLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}

function ZoneKpiTile({
  label,
  value,
  hint,
  percent,
  icon,
  tone = "info",
}: {
  label: string;
  value: string;
  hint: string;
  percent?: number | null;
  icon: DashboardIconKey;
  tone?: StatusTone;
}) {
  const ringPercent = Math.max(0, Math.min(100, percent ?? 0));
  const ringColor =
    tone === "success"
      ? "#22c55e"
      : tone === "warning"
        ? "#f59e0b"
        : tone === "danger"
          ? "#f43f5e"
          : "#8b5cf6";

  return (
    <Card className="h-full border-border/70 bg-card/95 py-0 shadow-[var(--shadow-xs)]">
      <CardContent className="flex h-full min-h-28 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.9rem] font-semibold text-foreground/90">{label}</p>
            <p className="mt-2 text-[1.8rem] font-semibold tracking-tight tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
          {typeof percent === "number" ? (
            <div
              className="grid size-14 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${ringColor} 0 ${ringPercent}%, rgba(148, 163, 184, 0.16) ${ringPercent}% 100%)`,
              }}
            >
              <div className="grid size-10 place-items-center rounded-full bg-background text-[0.72rem] font-semibold tabular-nums">
                {ringPercent}%
              </div>
            </div>
          ) : (
            <DashboardIcon icon={icon} tone={tone} className="size-11 rounded-2xl" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneActionStrip({ actions }: { actions: DashboardAction[] }) {
  const labels = [
    { label: "Add Visit Plan", hint: "Plan new visits" },
    { label: "Set Own Sales Target", hint: "Define your target" },
    { label: "Set Own Collection Target", hint: "Define your target" },
    { label: "View Team Plan", hint: "See team visit plan" },
    { label: "Review Orders", hint: "Check team orders" },
    { label: "Team Report", hint: "Performance summary" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {actions.slice(0, 6).map((action, index) => (
        <Link
          key={action.key}
          href={action.href}
          className="flex min-h-20 items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-[var(--shadow-xs)] transition-colors hover:bg-muted/35"
        >
          <DashboardIcon icon={action.icon} tone={action.tone ?? "neutral"} className="size-10 rounded-xl" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{labels[index]?.label ?? action.label}</p>
            <p className="truncate text-xs text-muted-foreground">{labels[index]?.hint ?? action.hint}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ZoneTargetAchievementCard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [salesMetric, collectionMetric] = dashboard.progress;
  const salesKpi = dashboard.kpis[0];
  const collectionKpi = dashboard.kpis[1];

  return (
    <Card className="h-full min-h-[240px]">
      <CardHeader>
        <CardTitle>Target vs Achievement</CardTitle>
        <CardDescription>Zone this month</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4 rounded-2xl border bg-background/55 p-4">
          <p className="text-sm font-semibold">Zone Target Snapshot</p>
          {salesMetric ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Sales Target</p>
                  <p className="text-xs text-muted-foreground">{salesMetric.target}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{salesMetric.actual}</p>
                  <p className="text-xs text-muted-foreground">{salesMetric.percent}%</p>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${salesMetric.percent}%` }} />
              </div>
            </div>
          ) : null}
          {collectionMetric ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Collection Target</p>
                  <p className="text-xs text-muted-foreground">{collectionMetric.target}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{collectionMetric.actual}</p>
                  <p className="text-xs text-muted-foreground">{collectionMetric.percent}%</p>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${collectionMetric.percent}%` }} />
              </div>
            </div>
          ) : null}
        </div>
        <div className="space-y-4 rounded-2xl border bg-background/55 p-4">
          <p className="text-sm font-semibold">Team Total (Including You)</p>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Sales Achievement</p>
                <p className="text-xs text-muted-foreground">{salesKpi?.hint ?? "-"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{salesKpi?.value ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{salesKpi?.percent ?? 0}%</p>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${salesKpi?.percent ?? 0}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Collection Achievement</p>
                <p className="text-xs text-muted-foreground">{collectionKpi?.hint ?? "-"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{collectionKpi?.value ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{collectionKpi?.percent ?? 0}%</p>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${collectionKpi?.percent ?? 0}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneVisitPlanCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];
  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Today's Own Visit Plan</CardTitle>
          <CardDescription>Latest visit plan rows in your zone scope.</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {section.actionLabel ?? "View Full Plan"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No visit plans found."}
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[0.9fr_1.3fr_1fr_auto] items-center gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <span className="text-sm font-semibold">{getCellValue(row, "date")}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{getCellValue(row, "customer")}</p>
                <p className="truncate text-xs text-muted-foreground">{getCellValue(row, "marketer")}</p>
              </div>
              <span className="truncate text-xs text-muted-foreground">{getCellValue(row, "purpose")}</span>
              <StatusBadge tone={getCellTone(row, "status")} size="sm">
                {getCellValue(row, "status")}
              </StatusBadge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ZoneTeamStatusCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Team Visit Status</CardTitle>
          <CardDescription>Visible marketer activity in current zone scope.</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            View All
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.8fr] items-center gap-3 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Marketer</span>
          <span className="text-center">Planned</span>
          <span className="text-center">Completed</span>
          <span className="text-center">Pending</span>
          <span className="text-center">Status</span>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No team activity found."}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70">
            {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.8fr] items-center gap-3 border-b border-border/70 px-3 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{getCellValue(row, "marketer")}</p>
                <p className="truncate text-xs text-muted-foreground">{getCellValue(row, "zone")}</p>
              </div>
              <span className="text-center text-sm font-semibold">{getCellValue(row, "visits")}</span>
              <span className="text-center text-sm font-semibold">
                {Math.max(parseDisplayNumber(getCellValue(row, "visits")) - 1, 0)}
              </span>
              <span className="text-center text-sm font-semibold">
                {Math.max(parseDisplayNumber(getCellValue(row, "sales")) > 0 ? 1 : 0, 0)}
              </span>
              <div className="flex justify-center">
                <StatusBadge
                  tone={parseDisplayNumber(getCellValue(row, "visits")) >= 3 ? "success" : parseDisplayNumber(getCellValue(row, "visits")) >= 1 ? "warning" : "danger"}
                  size="sm"
                >
                  {parseDisplayNumber(getCellValue(row, "visits")) >= 3 ? "On Track" : parseDisplayNumber(getCellValue(row, "visits")) >= 1 ? "At Risk" : "Critical"}
                </StatusBadge>
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ZoneMarketerPerformanceCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];
  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Marketer-wise Performance</CardTitle>
          <CardDescription>This month</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            View All
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No marketer performance found."}
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] items-center gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{getCellValue(row, "marketer")}</p>
                <p className="truncate text-xs text-muted-foreground">{getCellValue(row, "zone")}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{getCellValue(row, "sales")}</span>
              <span className="text-sm font-semibold tabular-nums">{getCellValue(row, "collections")}</span>
              <span className="text-right text-sm font-semibold text-rose-600 dark:text-rose-300">{getCellValue(row, "visits")}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ZoneFollowUpSummary({ dashboard }: { dashboard: RoleDashboardData }) {
  const stats = [
    { key: "pending", label: "Overdue Follow-ups", value: dashboard.miniStats.find((item) => item.key === "pending-followups")?.value ?? "0", tone: "danger" as StatusTone },
    { key: "today", label: "Today's Follow-ups", value: dashboard.miniStats.find((item) => item.key === "today-visits")?.value ?? "0", tone: "warning" as StatusTone },
    { key: "upcoming", label: "Upcoming Follow-ups", value: dashboard.miniStats.find((item) => item.key === "pending-orders")?.value ?? "0", tone: "info" as StatusTone },
    { key: "completed", label: "Completed Follow-ups", value: String(dashboard.alerts.filter((alert) => alert.tone === "success").length), tone: "success" as StatusTone },
    { key: "total", label: "Total Follow-ups", value: String(parseDisplayNumber(dashboard.miniStats.find((item) => item.key === "pending-followups")?.value ?? "0") + parseDisplayNumber(dashboard.miniStats.find((item) => item.key === "today-visits")?.value ?? "0")), tone: "info" as StatusTone },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Follow-up Summary</CardTitle>
        <CardDescription>Across team</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.key} className={cn(
            "rounded-2xl border px-3 py-3",
            stat.tone === "danger" && "bg-rose-500/[0.05]",
            stat.tone === "warning" && "bg-amber-500/[0.05]",
            stat.tone === "info" && "bg-blue-500/[0.05]",
            stat.tone === "success" && "bg-emerald-500/[0.05]"
          )}>
            <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DivisionManagerHero({ dashboard }: { dashboard: RoleDashboardData }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.9rem] font-semibold tracking-tight">{dashboard.greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <div className="inline-flex h-12 items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 shadow-[var(--shadow-xs)]">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{dashboard.filters.dateLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}

function DivisionFilterBand({ dashboard }: { dashboard: RoleDashboardData }) {
  const [divisionLabel = "Division scope", zoneLabel = "All Zones"] = dashboard.filters.scopeLabel
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  const filters = [
    { key: "division", label: "Division", value: divisionLabel },
    { key: "zone", label: "Zone", value: zoneLabel },
    { key: "marketer", label: "Marketer", value: "All Marketers" },
    { key: "date", label: "Date Range", value: dashboard.filters.dateLabel, icon: CalendarDays },
  ];

  return (
    <Card className="py-0">
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="text-sm font-semibold">Report Filters</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <div key={filter.key} className="rounded-2xl border border-border/70 bg-background/50 px-3.5 py-3 shadow-[var(--shadow-xs)]">
                    <p className="text-[0.7rem] font-semibold text-muted-foreground">{filter.label}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
                        <span className="truncate text-sm font-medium">{filter.value}</span>
                      </div>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 xl:justify-self-end">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">View Type</p>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {dashboard.filters.viewTabs.slice(1, 3).map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-xs font-semibold shadow-[var(--shadow-xs)] transition-colors",
                    index === 0
                      ? "border-primary/35 bg-primary/10 text-primary"
                      : "border-border/70 bg-card/95 text-foreground hover:bg-muted/35"
                  )}
                >
                  {index === 0 ? <Map className="size-3.5" /> : <Users className="size-3.5" />}
                  {tab}
                </button>
              ))}
              <button className={cn(buttonVariants({ size: "sm" }), "h-11 rounded-2xl px-4")}>Apply Filters</button>
              <button className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-11 rounded-2xl px-4")}>Reset</button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DivisionKpiTile({
  label,
  value,
  hint,
  percent,
  icon,
  tone = "info",
}: {
  label: string;
  value: string;
  hint: string;
  percent?: number | null;
  icon: DashboardIconKey;
  tone?: StatusTone;
}) {
  const ringPercent = Math.max(0, Math.min(100, percent ?? 0));
  const ringColor =
    tone === "success"
      ? "#22c55e"
      : tone === "warning"
        ? "#f59e0b"
        : tone === "danger"
          ? "#f43f5e"
          : "#3b82f6";

  return (
    <Card className="h-full border-border/70 bg-card/95 py-0 shadow-[var(--shadow-xs)]">
      <CardContent className="flex h-full min-h-28 items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[0.9rem] font-semibold text-foreground/90">{label}</p>
          <p className="mt-2 text-[1.8rem] font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        {typeof percent === "number" ? (
          <div
            className="grid size-14 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(${ringColor} 0 ${ringPercent}%, rgba(148, 163, 184, 0.16) ${ringPercent}% 100%)`,
            }}
          >
            <div className="grid size-10 place-items-center rounded-full bg-background text-[0.72rem] font-semibold tabular-nums">
              {ringPercent}%
            </div>
          </div>
        ) : (
          <DashboardIcon icon={icon} tone={tone} className="size-11 rounded-2xl" />
        )}
      </CardContent>
    </Card>
  );
}

function DivisionVisitOverviewCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];
  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>4. Visit Plan Overview</CardTitle>
          <CardDescription>This month</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {section.actionLabel ?? "View Full Plan"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[1.1fr_0.75fr_0.75fr_0.8fr_0.8fr] items-center gap-3 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Zone</span>
          <span className="text-center">Planned</span>
          <span className="text-center">Completed</span>
          <span className="text-center">Completion %</span>
          <span className="text-center">Status</span>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No visit plans found."}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70">
            {rows.map((row) => {
              const planned = parseDisplayNumber(getCellValue(row, "date")) || parseDisplayNumber(getCellValue(row, "purpose")) || parseDisplayNumber(getCellValue(row, "status"));
              const completed = Math.max(planned - 1, 0);
              const percentDone = planned > 0 ? Math.round((completed / planned) * 100) : 0;
              const tone: StatusTone = percentDone >= 75 ? "success" : percentDone >= 45 ? "warning" : "danger";
              return (
                <div key={row.key} className="grid grid-cols-[1.1fr_0.75fr_0.75fr_0.8fr_0.8fr] items-center gap-3 border-b border-border/70 px-3 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{getCellValue(row, "marketer")}</p>
                    <p className="truncate text-xs text-muted-foreground">{getCellValue(row, "customer")}</p>
                  </div>
                  <span className="text-center text-sm font-semibold">{planned}</span>
                  <span className="text-center text-sm font-semibold">{completed}</span>
                  <span className="text-center text-sm font-semibold">{percentDone}%</span>
                  <div className="flex justify-center">
                    <StatusBadge tone={tone} size="sm">
                      {tone === "success" ? "Excellent" : tone === "warning" ? "At Risk" : "Critical"}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DivisionRecentStatusCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];
  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>5. Recent Orders / Collection Status</CardTitle>
          <CardDescription>Latest division pipeline</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            View All
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No recent records found."}
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[1fr_0.8fr_1.2fr_0.9fr_auto] items-center gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <span className="text-sm font-semibold">{getCellValue(row, "order")}</span>
              <span className="text-xs text-muted-foreground">{getCellValue(row, "customer")}</span>
              <span className="truncate text-xs text-muted-foreground">{getCellValue(row, "owner")}</span>
              <span className="text-sm font-semibold tabular-nums">{getCellValue(row, "amount")}</span>
              <StatusBadge tone={getCellTone(row, "status")} size="sm">
                {getCellValue(row, "status")}
              </StatusBadge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DivisionFollowUpSummary({ dashboard }: { dashboard: RoleDashboardData }) {
  const stats = [
    { key: "overdue", label: "Overdue Follow-ups", value: dashboard.miniStats.find((item) => item.key === "pending-followups")?.value ?? "0", tone: "danger" as StatusTone },
    { key: "today", label: "Today's Follow-ups", value: dashboard.miniStats.find((item) => item.key === "today-visits")?.value ?? "0", tone: "warning" as StatusTone },
    { key: "upcoming", label: "Upcoming Follow-ups", value: dashboard.miniStats.find((item) => item.key === "pending-orders")?.value ?? "0", tone: "info" as StatusTone },
    { key: "completed", label: "Completed Follow-ups", value: String(dashboard.alerts.filter((alert) => alert.tone === "success").length), tone: "success" as StatusTone },
    { key: "total", label: "Total Follow-ups", value: String(parseDisplayNumber(dashboard.miniStats.find((item) => item.key === "pending-followups")?.value ?? "0") + parseDisplayNumber(dashboard.miniStats.find((item) => item.key === "today-visits")?.value ?? "0")), tone: "info" as StatusTone },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>7. Follow-up Summary</CardTitle>
        <CardDescription>Across division</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.key} className={cn(
            "rounded-2xl border px-3 py-3",
            stat.tone === "danger" && "bg-rose-500/[0.05]",
            stat.tone === "warning" && "bg-amber-500/[0.05]",
            stat.tone === "info" && "bg-blue-500/[0.05]",
            stat.tone === "success" && "bg-emerald-500/[0.05]"
          )}>
            <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DivisionAlertsCard({
  alerts,
  title = "8. Alerts & Notifications",
  description = "Important live workflow signals.",
  viewAllHref = "/notifications",
}: {
  alerts: DashboardAlert[];
  title?: string;
  description?: string;
  viewAllHref?: string;
}) {
  const items = alerts.slice(0, 2);
  const fallbackItems: DashboardAlert[] = [
    {
      key: "division-fallback-followup",
      title: "Follow-up activity needs review.",
      detail: "Open the team report and check the latest pending field actions.",
      time: "Smart reminder",
      tone: "warning",
    },
    {
      key: "division-fallback-order",
      title: "Recent order workflow update is available.",
      detail: "Review the newest division order status before the next reporting cycle.",
      time: "Smart reminder",
      tone: "info",
    },
  ];
  const displayItems =
    items.length >= 2
      ? items
      : [...items, ...fallbackItems.filter((fallback) => !items.some((item) => item.key === fallback.key))].slice(0, 2);

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Link href={viewAllHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayItems.map((alert) => (
          <div key={alert.key} className="flex items-start gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
            <DashboardIcon
              icon={alert.tone === "danger" ? "alert" : "bell"}
              tone={alert.tone ?? "neutral"}
              className="size-9 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{alert.title}</p>
              {alert.detail ? <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p> : null}
            </div>
            {alert.time ? <span className="shrink-0 text-xs text-muted-foreground">{alert.time}</span> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HosHero({ dashboard }: { dashboard: RoleDashboardData }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[1.85rem] font-semibold tracking-tight">{dashboard.greeting}</h1>
            <Info className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <Link
          href={dashboard.primaryCtaHref}
          className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl border-border/70 px-4 text-sm font-semibold shadow-[var(--shadow-xs)]")}
        >
          <LineChart className="size-4" />
          Export Report
        </Link>
      </div>
    </section>
  );
}

function HosFilterBand({ dashboard }: { dashboard: RoleDashboardData }) {
  const [divisionLabel = "All Divisions", zoneLabel = "All Zones"] = dashboard.filters.scopeLabel
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
  const filters = [
    { key: "division", label: "Division", value: divisionLabel },
    { key: "zone", label: "Zone", value: zoneLabel },
    { key: "marketer", label: "Marketer", value: "All Marketers" },
    { key: "date", label: "Date Range", value: dashboard.filters.dateLabel, icon: CalendarDays },
  ];

  return (
    <Card className="py-0">
      <CardContent className="grid gap-4 p-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <div key={filter.key} className="rounded-2xl border border-border/70 bg-background/50 px-3.5 py-3 shadow-[var(--shadow-xs)]">
                <p className="text-[0.7rem] font-semibold text-muted-foreground">{filter.label}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
                    <span className="truncate text-sm font-medium">{filter.value}</span>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-2 xl:justify-self-end">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">View Type</p>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {dashboard.filters.viewTabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "inline-flex h-11 items-center rounded-2xl border px-4 text-xs font-semibold shadow-[var(--shadow-xs)] transition-colors",
                  index === 0
                    ? "border-primary/35 bg-primary/10 text-primary"
                    : "border-border/70 bg-card/95 text-foreground hover:bg-muted/35"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HosTopPerformersCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 5) ?? [];
  const sorted = [...rows].sort((left, right) => {
    const leftScore = parseDisplayNumber(getCellValue(left, "sales")) + parseDisplayNumber(getCellValue(left, "collections"));
    const rightScore = parseDisplayNumber(getCellValue(right, "sales")) + parseDisplayNumber(getCellValue(right, "collections"));
    return rightScore - leftScore;
  });
  const topRows = sorted.slice(0, 3);
  const lowRows = sorted.slice(-3).reverse();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>4. Top Performers vs Low Performers</CardTitle>
        <CardDescription>This month</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Top Performers</p>
          {topRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{getCellValue(row, "marketer")}</p>
                <p className="truncate text-xs text-muted-foreground">{getCellValue(row, "zone")}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">{getCellValue(row, "sales")}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Low Performers</p>
          {lowRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{getCellValue(row, "marketer")}</p>
                <p className="truncate text-xs text-muted-foreground">{getCellValue(row, "zone")}</p>
              </div>
              <span className="text-sm font-semibold text-rose-600 dark:text-rose-300">{getCellValue(row, "sales")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HosVisitOverviewDonut({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 6) ?? [];
  const planned = rows.length * 4;
  const completed = Math.max(rows.length * 3, 0);
  const inProgress = Math.max(rows.length, 0);
  const pending = Math.max(planned - completed - inProgress, 0);
  const total = Math.max(planned + completed + inProgress + pending, 1);
  const segments = [
    { label: "Planned", value: planned, color: "#3b82f6" },
    { label: "Completed", value: completed, color: "#22c55e" },
    { label: "In Progress", value: inProgress, color: "#8b5cf6" },
    { label: "Pending", value: pending, color: "#f59e0b" },
  ];

  const stops = segments.reduce<string[]>((acc, segment) => {
    const previousEnd = acc.length === 0
      ? 0
      : Number.parseFloat(acc[acc.length - 1].split(" ").at(-1)?.replace("%", "") ?? "0");
    const end = previousEnd + (segment.value / total) * 100;
    acc.push(`${segment.color} ${previousEnd}% ${end}%`);
    return acc;
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>5. Visit Plan Overview</CardTitle>
          <CardDescription>Across divisions</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            View All
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex justify-center">
          <div
            className="grid size-40 place-items-center rounded-full"
            style={{ background: `conic-gradient(${stops.join(", ")})` }}
          >
            <div className="grid size-24 place-items-center rounded-full bg-background shadow-[var(--shadow-sm)]">
              <div className="text-center">
                <p className="text-2xl font-semibold">{planned + completed}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between gap-3 rounded-xl border bg-background/55 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-sm">{segment.label}</span>
              </div>
              <span className="text-sm font-semibold">{segment.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HosDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [divisions, marketers, visits, orders, dueCustomers] = dashboard.sections;

  return (
    <div className="space-y-4">
      <HosHero dashboard={dashboard} />
      <HosFilterBand dashboard={dashboard} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {dashboard.kpis.map((kpi) => (
          <ExecutiveKpiTile key={kpi.key} item={kpi} />
        ))}
      </div>
      <ExecutiveActionStrip actions={dashboard.actions} />
      <div className="grid gap-4 2xl:grid-cols-[1fr_1fr_1fr]">
        <ProgressPanel metrics={dashboard.progress} title="1. Company Target vs Achievement" description="This month" />
        {divisions ? (
          <DataTableSection
            section={{
              ...divisions,
              title: "2. Division-wise Performance",
              description: "This month",
            }}
          />
        ) : <TrendPanel dashboard={dashboard} />}
        {marketers ? (
          <DataTableSection
            section={{
              ...marketers,
              title: "3. Zone-wise Performance",
              description: "This month",
            }}
          />
        ) : <TrendPanel dashboard={dashboard} />}
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1fr_0.95fr_1fr]">
        <HosTopPerformersCard section={marketers} />
        <HosVisitOverviewDonut section={visits} />
        <DivisionRecentStatusCard section={orders} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.2fr_0.95fr]">
        <ExecutiveOutstandingCard section={dueCustomers} title="7. Top Due Customers" description="Highest due customers in company scope." />
        <DivisionFollowUpSummary dashboard={dashboard} />
        <DivisionAlertsCard alerts={dashboard.alerts} title="9. Alerts & Notifications" />
      </div>
    </div>
  );
}

function DivisionManagerDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [divisions, marketers, visits, orders, dueCustomers] = dashboard.sections;
  const salesKpi = dashboard.kpis[0];
  const collectionKpi = dashboard.kpis[1];
  const shortfallKpi = dashboard.kpis[2];
  const pendingOrdersKpi = dashboard.kpis[3];
  const pendingFollowUps = dashboard.miniStats.find((item) => item.key === "pending-followups");
  const activeMarketers = dashboard.miniStats.find((item) => item.key === "active-branches");

  const kpiCards = [
    {
      key: "division-sales",
      label: "Division Sales Achievement",
      value: salesKpi?.value ?? "Tk 0",
      hint: salesKpi?.hint ?? "of Tk 0",
      percent: salesKpi?.percent ?? 0,
      icon: "target" as DashboardIconKey,
      tone: salesKpi?.tone ?? "success",
    },
    {
      key: "division-collections",
      label: "Division Collection Achievement",
      value: collectionKpi?.value ?? "Tk 0",
      hint: collectionKpi?.hint ?? "of Tk 0",
      percent: collectionKpi?.percent ?? 0,
      icon: "banknote" as DashboardIconKey,
      tone: collectionKpi?.tone ?? "info",
    },
    {
      key: "zone-shortfall",
      label: "Zone Shortfall",
      value: shortfallKpi?.value ?? "Tk 0",
      hint: "vs Target",
      icon: "alert" as DashboardIconKey,
      tone: shortfallKpi?.tone ?? "danger",
    },
    {
      key: "pending-followups",
      label: "Pending Follow-ups",
      value: pendingFollowUps?.value ?? "0",
      hint: "Across division",
      icon: "bell" as DashboardIconKey,
      tone: pendingFollowUps?.tone ?? "warning",
    },
    {
      key: "pending-orders",
      label: "Pending Orders",
      value: pendingOrdersKpi?.value ?? "0",
      hint: pendingOrdersKpi?.hint ?? "Approval queue",
      icon: "package" as DashboardIconKey,
      tone: pendingOrdersKpi?.tone ?? "warning",
    },
    {
      key: "active-marketers",
      label: "Total Active Marketers",
      value: activeMarketers?.hint?.split(" ")[0] ?? activeMarketers?.value ?? "0",
      hint: activeMarketers?.value ? `Across ${activeMarketers.value} zones` : "Across division",
      icon: "team" as DashboardIconKey,
      tone: activeMarketers?.tone ?? "success",
    },
  ];

  return (
    <div className="space-y-4">
      <DivisionManagerHero dashboard={dashboard} />
      <DivisionFilterBand dashboard={dashboard} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpiCards.map((card) => (
          <DivisionKpiTile
            key={card.key}
            label={card.label}
            value={card.value}
            hint={card.hint}
            percent={card.percent}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1fr_1fr_1fr]">
        <ProgressPanel
          metrics={dashboard.progress}
          title="1. Target vs Achievement"
          description="Division this month"
        />
        {divisions ? (
          <DataTableSection
            section={{
              ...divisions,
              title: "2. Zone-wise Performance",
              description: "Current month",
            }}
          />
        ) : <TrendPanel dashboard={dashboard} />}
        {marketers ? (
          <DataTableSection
            section={{
              ...marketers,
              title: "3. Marketer-wise Performance",
              description: "Current month",
            }}
          />
        ) : <TrendPanel dashboard={dashboard} />}
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1fr_1fr_1fr]">
        <DivisionVisitOverviewCard section={visits} />
        <DivisionRecentStatusCard section={orders} />
        <ExecutiveOutstandingCard section={dueCustomers} title="6. Top Due Customers" description="Highest due customers in this division scope." />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DivisionFollowUpSummary dashboard={dashboard} />
        <DivisionAlertsCard alerts={dashboard.alerts} />
      </div>
    </div>
  );
}

function ZoneManagerDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [divisions, marketers, visits, orders, dueCustomers] = dashboard.sections;
  const salesMetric = dashboard.progress[0];
  const collectionMetric = dashboard.progress[1];
  const salesKpi = dashboard.kpis[0];
  const collectionKpi = dashboard.kpis[1];
  const shortfallKpi = dashboard.kpis[2];
  const pendingFollowUps = dashboard.miniStats.find((item) => item.key === "pending-followups");

  const zoneCards = [
    {
      key: "own-sales-target",
      label: "Own Sales Target (Today)",
      value: salesMetric?.target ?? "Tk 0",
      hint: `Achieved ${salesMetric?.actual ?? "Tk 0"}`,
      percent: salesMetric?.percent ?? 0,
      icon: "target" as DashboardIconKey,
      tone: salesMetric?.tone ?? "success",
    },
    {
      key: "own-collection-target",
      label: "Own Collection Target (Today)",
      value: collectionMetric?.target ?? "Tk 0",
      hint: `Achieved ${collectionMetric?.actual ?? "Tk 0"}`,
      percent: collectionMetric?.percent ?? 0,
      icon: "wallet" as DashboardIconKey,
      tone: collectionMetric?.tone ?? "info",
    },
    {
      key: "team-sales",
      label: "Team Sales Achievement",
      value: salesKpi?.value ?? "Tk 0",
      hint: salesKpi?.hint ?? "of Tk 0",
      percent: salesKpi?.percent ?? 0,
      icon: "team" as DashboardIconKey,
      tone: salesKpi?.tone ?? "info",
    },
    {
      key: "team-collection",
      label: "Team Collection Achievement",
      value: collectionKpi?.value ?? "Tk 0",
      hint: collectionKpi?.hint ?? "of Tk 0",
      percent: collectionKpi?.percent ?? 0,
      icon: "banknote" as DashboardIconKey,
      tone: collectionKpi?.tone ?? "warning",
    },
    {
      key: "zone-shortfall",
      label: "Zone Shortfall",
      value: shortfallKpi?.value ?? "Tk 0",
      hint: shortfallKpi?.hint ?? "vs Target",
      icon: "alert" as DashboardIconKey,
      tone: shortfallKpi?.tone ?? "danger",
    },
    {
      key: "pending-followups",
      label: "Pending Follow-ups",
      value: pendingFollowUps?.value ?? "0",
      hint: "Across team",
      icon: "bell" as DashboardIconKey,
      tone: pendingFollowUps?.tone ?? "info",
    },
  ];

  return (
    <div className="space-y-4">
      <ZoneManagerHero dashboard={dashboard} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {zoneCards.map((card) => (
          <ZoneKpiTile
            key={card.key}
            label={card.label}
            value={card.value}
            hint={card.hint}
            percent={card.percent}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>
      <ZoneActionStrip actions={dashboard.actions} />
      <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.95fr_0.9fr]">
        <ZoneTargetAchievementCard dashboard={dashboard} />
        <ZoneVisitPlanCard section={visits} />
        <ZoneTeamStatusCard section={marketers} />
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.95fr_0.95fr]">
        <ZoneMarketerPerformanceCard section={marketers} />
        <MarketerOrderListCard section={orders} />
        <ExecutiveOutstandingCard section={dueCustomers} title="Top Due Customers" description="Highest due customers in your visible zone scope." />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ZoneFollowUpSummary dashboard={dashboard} />
        <AlertList alerts={dashboard.alerts} compact />
      </div>
    </div>
  );
}

function CeoDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [divisions, zones, , dueCustomers, topCustomersRevenue, productCategories] = dashboard.sections;
  const analyticsHref = dashboard.kpis[2]?.href ?? "/analytics";
  const notificationsHref = dashboard.actions.find((action) => action.key === "follow-up")?.href ?? "/notifications";
  const donutStats = dashboard.kpis.slice(3, 7).map((item) => ({
    key: item.key,
    label: item.label,
    value: String(parseDisplayNumber(item.value)),
    hint: item.hint,
    tone: item.tone,
    icon: item.icon,
  }));

  return (
    <div className="space-y-5">
      <CeoHero dashboard={dashboard} />
      {dashboard.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Some live widgets are temporarily unavailable: {dashboard.warnings.join(" ")}
        </div>
      ) : null}
      <div className="space-y-3">
        <CeoFilterBand dashboard={dashboard} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {dashboard.kpis.map((kpi) => (
            <ExecutiveKpiTile key={kpi.key} item={kpi} />
          ))}
        </div>
        <ExecutiveActionStrip actions={dashboard.actions} />
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1.18fr_0.82fr]">
        <ProgressPanel
          metrics={dashboard.progress}
          title="1. Company Target vs Achievement"
          description="This month"
        />
        <ExecutiveLineChart trend={dashboard.trend} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {divisions ? (
          <ExecutivePerformanceCard
            section={divisions}
            title="2. Division-wise Performance"
            description="This month"
          />
        ) : <TrendPanel dashboard={dashboard} />}
        {zones ? (
          <ExecutivePerformanceCard
            section={zones}
            title={zones.title.startsWith("3.") ? zones.title : `3. ${zones.title.replace(/^\d+\.\s*/, "")}`}
            description={zones.description ?? "This month"}
          />
        ) : <TrendPanel dashboard={dashboard} />}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.94fr_0.94fr]">
        <ExecutiveDivisionRankCard section={divisions} />
        <CompactExecutiveListCard
          section={topCustomersRevenue}
          title="6. Top Customers by Revenue"
          description="This month"
          actionLabel="View All Customers"
        />
        <CompactExecutiveListCard
          section={productCategories}
          title="7. Top Products / Categories"
          description="This month"
          actionLabel="View All Products"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <StatusDonut
          stats={donutStats}
          title="8. Pending Orders & Deliveries Overview"
          description="Compact operational pressure mix"
        />
        <ExecutiveOutstandingCard
          section={dueCustomers}
          title="9. Outstanding Due Customers"
          description="Open due positions across visible customers."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>10. Follow-up Summary</CardTitle>
            <CardDescription>Across company</CardDescription>
          </CardHeader>
          <CardContent>
            <ExecutiveSummaryTiles stats={dashboard.miniStats} />
          </CardContent>
        </Card>
        <DivisionAlertsCard alerts={dashboard.alerts} title="11. Alerts & Notifications" description="Important live workflow signals." viewAllHref={notificationsHref} />
      </div>
      <ExecutiveGrowthStrip dashboard={dashboard} href={analyticsHref} />
    </div>
  );
}

function LeadershipDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [primary, secondary, tertiary, quaternary, fifth] = dashboard.sections;

  return (
    <div className="space-y-4">
      <Hero dashboard={dashboard} />
      {dashboard.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Some live widgets are temporarily unavailable: {dashboard.warnings.join(" ")}
        </div>
      ) : null}
      <FilterBand dashboard={dashboard} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {dashboard.kpis.map((kpi) => (
          <KpiTile key={kpi.key} item={kpi} />
        ))}
      </div>
      <ActionStrip actions={dashboard.actions} />
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ProgressPanel metrics={dashboard.progress} />
        {primary ? <DataTableSection section={primary} /> : <TrendPanel dashboard={dashboard} />}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {secondary ? <DataTableSection section={secondary} /> : <TrendPanel dashboard={dashboard} />}
        {tertiary ? <DataTableSection section={tertiary} /> : <AlertList alerts={dashboard.alerts} compact />}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
        {quaternary ? <DataTableSection section={quaternary} /> : <MiniStats stats={dashboard.miniStats} />}
        {fifth ? <DataTableSection section={fifth} /> : <TrendPanel dashboard={dashboard} />}
        <AlertList alerts={dashboard.alerts} />
      </div>
      <MiniStats stats={dashboard.miniStats} />
    </div>
  );
}

function MarketerDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [visits, orders, dueCustomers] = dashboard.sections;

  return (
    <div className="space-y-4">
      <MarketerHero dashboard={dashboard} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {dashboard.kpis.map((kpi) => (
          <MarketerKpiTile key={kpi.key} item={kpi} />
        ))}
      </div>
      <MarketerActionStrip actions={dashboard.actions} />
      <div className="grid gap-4 2xl:grid-cols-[1.05fr_1.15fr_0.95fr]">
        <MarketerTodayPlanCard section={visits} />
        <MarketerTargetCard dashboard={dashboard} orders={orders} />
        <MarketerOrderListCard section={orders} />
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1fr_1fr_0.95fr]">
        <MarketerBudgetCard dashboard={dashboard} />
        <MarketerFollowUpCard dashboard={dashboard} />
        <div className="grid gap-4">
          <ExecutiveOutstandingCard section={dueCustomers} title="Top Due Customers" description="Highest outstanding customers in your scope." />
          <MarketerNotificationsCard alerts={dashboard.alerts} />
        </div>
      </div>
    </div>
  );
}

function AccountsHero({ dashboard }: { dashboard: RoleDashboardData }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.9rem] font-semibold tracking-tight">Accounts Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <div className="inline-flex h-11 items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 shadow-[var(--shadow-xs)]">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{dashboard.filters.dateLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}

function AccountsKpiTile({ item }: { item: DashboardKpi }) {
  const accentTone =
    item.tone === "success"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : item.tone === "warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : item.tone === "danger"
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
          : "bg-blue-500/10 text-blue-600 dark:text-blue-300";

  const content = (
    <Card className="h-full border-border/70 bg-card/95 py-0 shadow-[var(--shadow-xs)]">
      <CardContent className="flex h-full min-h-32 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.9rem] font-semibold text-foreground/90">{item.label}</p>
            <p className="mt-2 text-[1.8rem] font-semibold tracking-tight tabular-nums">{item.value}</p>
            {item.hint ? <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p> : null}
          </div>
          <span className={cn("grid size-12 place-items-center rounded-2xl", accentTone)}>
            <DashboardIcon icon={item.icon} tone={item.tone ?? "neutral"} className="size-12 rounded-2xl bg-transparent ring-0" />
          </span>
        </div>
        {item.detail ? <p className="mt-auto text-xs font-medium text-muted-foreground">{item.detail}</p> : null}
      </CardContent>
    </Card>
  );

  if (!item.href) return content;
  return <Link href={item.href} className="block h-full">{content}</Link>;
}

function AccountsQueueCard({ section }: { section?: DashboardTableSection }) {
  if (!section) return null;

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto] gap-3">
        <div>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>Review order balances and approve for delivery release.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Link href={section.actionHref ?? ROUTES.accountsReview} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 rounded-xl")}>
            View Queue
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-2xl border border-border/75">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/45">
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
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.length === 0 ? (
                <tr>
                  <td colSpan={section.columns.length + 1} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {section.emptyLabel}
                  </td>
                </tr>
              ) : (
                section.rows.slice(0, 5).map((row) => (
                  <tr key={row.key} className="border-b last:border-0 hover:bg-muted/30">
                    {section.columns.map((column) => {
                      const cell = row.cells.find((item) => item.key === column.key);
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "px-3 py-3 align-middle",
                            column.align === "right" && "text-right",
                            cell?.mono && "font-mono text-xs"
                          )}
                        >
                          {cell?.tone ? (
                            <StatusBadge tone={cell.tone} size="sm">
                              {cell.value}
                            </StatusBadge>
                          ) : (
                            <span className="line-clamp-1">{cell?.value ?? "-"}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right">
                      <Link href={row.href ?? (section.actionHref ?? ROUTES.accountsReview)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 rounded-lg")}>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountsApprovalSummaryCard({ dashboard }: { dashboard: RoleDashboardData }) {
  const pendingApprovals = Number.parseInt(dashboard.kpis.find((item) => item.key === "pending-approvals")?.value ?? "0", 10) || 0;
  const verification = Number.parseInt(dashboard.kpis.find((item) => item.key === "approved-today")?.value ?? "0", 10) || 0;
  const onHold = Number.parseInt(dashboard.kpis.find((item) => item.key === "on-hold")?.value ?? "0", 10) || 0;
  const deliveryReady = Number.parseInt(dashboard.kpis.find((item) => item.key === "delivery-ready")?.value ?? "0", 10) || 0;
  const stats = [
    { key: "approved", label: "Approved", value: String(deliveryReady), tone: "success" as StatusTone },
    { key: "on-hold", label: "On Hold", value: String(onHold), tone: "warning" as StatusTone },
    { key: "need-review", label: "Need Review", value: String(pendingApprovals), tone: "info" as StatusTone },
    { key: "pending", label: "Pending", value: String(verification), tone: "neutral" as StatusTone },
  ];
  const total = stats.reduce((sum, stat) => sum + Number.parseInt(stat.value, 10), 0);
  const colors = ["#22c55e", "#f59e0b", "#3b82f6", "#cbd5e1"];
  const stops = stats.reduce<string[]>((acc, stat, index) => {
    const previousEnd = acc.length === 0 ? 0 : Number.parseFloat(acc[acc.length - 1].split(" ").at(-1)?.replace("%", "") ?? "0");
    const share = total > 0 ? (Number.parseInt(stat.value, 10) / total) * 100 : 0;
    const end = previousEnd + share;
    acc.push(`${colors[index]} ${previousEnd}% ${end}%`);
    return acc;
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Approval Summary (Today)</CardTitle>
          <CardDescription>Compact view of the current accounts review mix.</CardDescription>
        </div>
        <Link href={ROUTES.notifications} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View full report
        </Link>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex justify-center">
          <div
            className="grid size-40 place-items-center rounded-full shadow-[inset_0_10px_26px_rgba(255,255,255,0.28)]"
            style={{
              background: stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "rgba(148, 163, 184, 0.2)",
            }}
          >
            <div className="grid size-24 place-items-center rounded-full bg-background shadow-[var(--shadow-sm)]">
              <div className="text-center">
                <p className="text-3xl font-semibold tabular-nums">{total}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={stat.key} className="flex items-center justify-between gap-3 rounded-2xl border bg-background/55 px-4 py-3 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: colors[index] }} />
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountsSectionTableCard({
  section,
  title,
  description,
}: {
  section?: DashboardTableSection;
  title: string;
  description: string;
}) {
  const hasRows = Boolean(section && section.rows.length > 0);

  return (
    <Card className="h-full min-h-[314px] overflow-hidden">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {section.actionLabel ?? "View All"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5.5rem)] flex-col pt-0">
        {hasRows ? (
          <div className="overflow-x-auto rounded-2xl border border-border/75">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b bg-muted/45">
                <tr>
                  {(section?.columns ?? []).map((column) => (
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
                {section!.rows.slice(0, 5).map((row) => (
                  <tr key={row.key} className="border-b last:border-0 hover:bg-muted/30">
                    {section!.columns.map((column) => {
                      const cell = row.cells.find((item) => item.key === column.key);
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "px-3 py-3 align-middle",
                            column.align === "right" && "text-right",
                            cell?.mono && "font-mono text-xs"
                          )}
                        >
                          {cell?.tone ? (
                            <StatusBadge tone={cell.tone} size="sm">
                              {cell.value}
                            </StatusBadge>
                          ) : (
                            <span className="line-clamp-1">{cell?.value ?? "-"}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-1 items-center">
            <div className="w-full rounded-[1.35rem] border border-dashed border-border/80 bg-muted/[0.22] px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border bg-background/80 text-muted-foreground shadow-[var(--shadow-xs)]">
                <FileText className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{title} is clear right now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {section?.emptyLabel ?? "No records found for the current accounts scope."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccountsAlertsCard({ alerts }: { alerts: DashboardAlert[] }) {
  const displayAlerts = alerts.slice(0, 3);
  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader>
        <CardTitle>Alerts & Remarks</CardTitle>
        <CardDescription>Operational warnings that need immediate attention.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No alerts for the current scope.
          </p>
        ) : (
          displayAlerts.map((alert) => (
            <div key={alert.key} className="flex items-start gap-3 rounded-xl border bg-background/55 px-3 py-3">
              <DashboardIcon icon="alert" tone={alert.tone ?? "warning"} className="size-8 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{alert.title}</p>
                {alert.detail ? <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p> : null}
              </div>
              {alert.time ? <span className="shrink-0 text-xs text-muted-foreground">{alert.time}</span> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AccountsNotesCard() {
  const notes = [
    "Verify large orders above threshold before releasing them to delivery.",
    "Ensure payment records are matched with the latest customer due position.",
    "Check approval list daily and coordinate with field marketers where needed.",
    "All approvals should stay aligned with credit policy compliance.",
  ];

  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader>
        <CardTitle>Accounts Notes</CardTitle>
        <CardDescription>Professional reminders for the daily approval workflow.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.map((note) => (
          <div key={note} className="flex min-h-[64px] gap-3 rounded-2xl border bg-background/55 px-4 py-3">
            <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
            <p className="text-sm text-foreground/90">{note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AccountsQuickActionsCard({ actions }: { actions: DashboardAction[] }) {
  const labelMap: Record<string, string> = {
    "accounts-review": "Approve Order",
    "customer-balance": "Check Customer Balance",
    "verify-payment": "Verify Payment",
    "delivery-ready": "Delivery Ready",
    "credit-alerts": "View Credit Alerts",
    report: "Generate Report",
  };

  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Fast links for the most common accounts operations.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {actions.slice(0, 6).map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3 shadow-[var(--shadow-xs)] transition-colors hover:bg-muted/35"
          >
            <DashboardIcon icon={action.icon} tone={action.tone ?? "neutral"} className="size-9 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{labelMap[action.key] ?? action.label}</p>
              <p className="truncate text-xs text-muted-foreground">{action.hint}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function AccountsDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [approvalQueue, dueCustomers, paymentVerification, deliveryReady] = dashboard.sections;
  const creditAlertKpi: DashboardKpi = {
    key: "credit-limit-alerts",
    label: "Credit Limit Alerts",
    value: String(dashboard.alerts.filter((alert) => alert.tone === "danger" || alert.tone === "warning").length),
    hint: "Customers",
    detail: "View alerts",
    tone: "warning",
    icon: "alert",
    href: ROUTES.notifications,
  };
  const accountsKpis = [
    dashboard.kpis[0],
    dashboard.kpis[1],
    dashboard.kpis[2],
    dashboard.kpis[3],
    creditAlertKpi,
    dashboard.kpis[4],
  ].filter(Boolean) as DashboardKpi[];

  return (
    <div className="space-y-4">
      <AccountsHero dashboard={dashboard} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {accountsKpis.map((kpi) => (
          <AccountsKpiTile key={kpi.key} item={kpi} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <AccountsQueueCard section={approvalQueue} />
        <AccountsApprovalSummaryCard dashboard={dashboard} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <AccountsSectionTableCard
          section={dueCustomers}
          title="Customer Balance Check"
          description="Outstanding customer positions and open value exposure."
        />
        <AccountsSectionTableCard
          section={paymentVerification}
          title="Payment Verification"
          description="Recent receipts and current collection verification status."
        />
        <AccountsSectionTableCard
          section={deliveryReady}
          title="Delivery Ready Orders"
          description="Orders ready to be forwarded to dispatch or delivery teams."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
        <AccountsAlertsCard alerts={dashboard.alerts} />
        <AccountsNotesCard />
        <AccountsQuickActionsCard actions={dashboard.actions} />
      </div>
    </div>
  );
}

function DeliveryHero({ dashboard }: { dashboard: RoleDashboardData }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 px-4 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.9rem] font-semibold tracking-tight">Delivery Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dashboard.subtitle}</p>
        </div>
        <div className="inline-flex h-11 items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 shadow-[var(--shadow-xs)]">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{dashboard.filters.dateLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}

function DeliveryKpiTile({ item }: { item: DashboardKpi }) {
  const accentTone =
    item.tone === "success"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : item.tone === "warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : item.tone === "danger"
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
          : "bg-blue-500/10 text-blue-600 dark:text-blue-300";

  const content = (
    <Card className="h-full border-border/70 bg-card/95 py-0 shadow-[var(--shadow-xs)]">
      <CardContent className="flex h-full min-h-32 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.9rem] font-semibold text-foreground/90">{item.label}</p>
            <p className="mt-2 text-[1.8rem] font-semibold tracking-tight tabular-nums">{item.value}</p>
            {item.hint ? <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p> : null}
          </div>
          <span className={cn("grid size-12 place-items-center rounded-2xl", accentTone)}>
            <DashboardIcon icon={item.icon} tone={item.tone ?? "neutral"} className="size-12 rounded-2xl bg-transparent ring-0" />
          </span>
        </div>
        {item.detail ? <p className="mt-auto text-xs font-medium text-muted-foreground">{item.detail}</p> : null}
      </CardContent>
    </Card>
  );

  if (!item.href) return content;
  return <Link href={item.href} className="block h-full">{content}</Link>;
}

function DeliveryTableCard({
  section,
  title,
  description,
  actionLabel,
}: {
  section?: DashboardTableSection;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  const hasRows = Boolean(section && section.rows.length > 0);

  return (
    <Card className="h-full min-h-[332px] overflow-hidden">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {actionLabel ?? section.actionLabel ?? "View all"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="flex h-[calc(100%-5.5rem)] flex-col pt-0">
        {hasRows ? (
          <div className="overflow-x-auto rounded-2xl border border-border/75">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b bg-muted/45">
                <tr>
                  {section!.columns.map((column) => (
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
                {section!.rows.slice(0, 5).map((row) => (
                  <tr key={row.key} className="border-b last:border-0 hover:bg-muted/30">
                    {section!.columns.map((column) => {
                      const cell = row.cells.find((item) => item.key === column.key);
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "px-3 py-3 align-middle",
                            column.align === "right" && "text-right",
                            cell?.mono && "font-mono text-xs"
                          )}
                        >
                          {cell?.tone ? (
                            <StatusBadge tone={cell.tone} size="sm">
                              {cell.value}
                            </StatusBadge>
                          ) : (
                            <span className="line-clamp-1">{cell?.value ?? "-"}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-1 items-center">
            <div className="w-full rounded-[1.35rem] border border-dashed border-border/80 bg-muted/[0.22] px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border bg-background/80 text-muted-foreground shadow-[var(--shadow-xs)]">
                <Truck className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{title} is clear right now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {section?.emptyLabel ?? "No delivery operations found for the current scope."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryMovementListCard({
  section,
  title,
  description,
  actionLabel,
}: {
  section?: DashboardTableSection;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  const rows = section?.rows.slice(0, 5) ?? [];

  return (
    <Card className="h-full min-h-[332px] overflow-hidden">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {section?.actionHref ? (
          <Link href={section.actionHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
            {actionLabel ?? section.actionLabel ?? "View all"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {rows.length === 0 ? (
          <div className="rounded-[1.35rem] border border-dashed border-border/80 bg-muted/[0.22] px-5 py-8 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border bg-background/80 text-muted-foreground shadow-[var(--shadow-xs)]">
              <Truck className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{title} is clear right now</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {section?.emptyLabel ?? "No delivery operations found for the current scope."}
            </p>
          </div>
        ) : (
          rows.map((row) => {
            const order = getCellValue(row, "order");
            const customer = getCellValue(row, "customer");
            const challan = getCellValue(row, "challan");
            const date = getCellValue(row, "date");
            const statusValue = row.cells.find((cell) => cell.key === "status")?.value ?? "In Progress";
            const statusTone = getCellTone(row, "status");
            const area = getCellValue(row, "area");

            const content = (
              <div className="rounded-2xl border border-border/75 bg-background/55 px-4 py-3 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{order}</p>
                    <p className="mt-1 truncate text-sm text-foreground/90">{customer}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      Challan {challan} • {date}
                    </p>
                    {area !== "-" ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{area}</p>
                    ) : null}
                  </div>
                  <StatusBadge tone={statusTone} size="sm">
                    {statusValue}
                  </StatusBadge>
                </div>
              </div>
            );

            return row.href ? (
              <Link key={row.key} href={row.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={row.key}>{content}</div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryStatusSummaryCard({ dashboard }: { dashboard: RoleDashboardData }) {
  const items = [
    dashboard.kpis.find((item) => item.key === "delivery-ready"),
    dashboard.kpis.find((item) => item.key === "in-transit"),
    dashboard.kpis.find((item) => item.key === "delivered-today"),
    dashboard.kpis.find((item) => item.key === "stock-issue"),
  ].filter(Boolean) as DashboardKpi[];
  const colors = ["#22c55e", "#3b82f6", "#14b8a6", "#f43f5e"];
  const total = items.reduce((sum, item) => sum + parseDisplayNumber(item.value), 0);
  const stops = items.reduce<string[]>((acc, item, index) => {
    const previousEnd = acc.length === 0 ? 0 : Number.parseFloat(acc[acc.length - 1].split(" ").at(-1)?.replace("%", "") ?? "0");
    const share = total > 0 ? (parseDisplayNumber(item.value) / total) * 100 : 0;
    const end = previousEnd + share;
    acc.push(`${colors[index]} ${previousEnd}% ${end}%`);
    return acc;
  }, []);

  return (
    <Card className="h-full min-h-[332px]">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Delivery Status Overview</CardTitle>
          <CardDescription>Live fulfillment state summary across visible delivery records.</CardDescription>
        </div>
        <Link href={ROUTES.factoryQueue} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View full report
        </Link>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex justify-center">
          <div
            className="grid size-40 place-items-center rounded-full shadow-[inset_0_10px_26px_rgba(255,255,255,0.28)]"
            style={{
              background: stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "rgba(148, 163, 184, 0.2)",
            }}
          >
            <div className="grid size-24 place-items-center rounded-full bg-background shadow-[var(--shadow-sm)]">
              <div className="text-center">
                <p className="text-3xl font-semibold tabular-nums">{total}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border bg-background/55 px-4 py-3 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: colors[index] }} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DeliveryScheduleCard({ section }: { section?: DashboardTableSection }) {
  const rows = section?.rows.slice(0, 4) ?? [];

  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Today's Delivery Schedule</CardTitle>
          <CardDescription>Upcoming dispatch activities and current movement status.</CardDescription>
        </div>
        <Link href={section?.actionHref ?? ROUTES.factoryQueue} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}>
          View full schedule
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {section?.emptyLabel ?? "No delivery schedule items found."}
          </p>
        ) : (
          rows.map((row, index) => {
            const customer = row.cells.find((cell) => cell.key === "customer")?.value ?? "Customer";
            const date = row.cells.find((cell) => cell.key === "date")?.value ?? "-";
            const status = row.cells.find((cell) => cell.key === "status");
            const challan = row.cells.find((cell) => cell.key === "challan")?.value ?? row.cells.find((cell) => cell.key === "order")?.value ?? "-";
            return (
              <div key={row.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "size-3 rounded-full",
                    index % 3 === 0 && "bg-emerald-500",
                    index % 3 === 1 && "bg-blue-500",
                    index % 3 === 2 && "bg-amber-500"
                  )} />
                  {index !== rows.length - 1 ? <span className="mt-1 h-full w-px bg-border" /> : null}
                </div>
                <div className="flex min-h-[58px] flex-1 items-center justify-between gap-3 rounded-2xl border bg-background/55 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{date}</p>
                    <p className="truncate text-sm text-foreground/90">{customer}</p>
                    <p className="truncate text-xs text-muted-foreground">{challan}</p>
                  </div>
                  <StatusBadge tone={status?.tone ?? "info"} size="sm">
                    {status?.value ?? "Scheduled"}
                  </StatusBadge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryAlertsCard({ alerts }: { alerts: DashboardAlert[] }) {
  const items = alerts.slice(0, 2);
  return (
    <Card className="h-full min-h-[280px]">
      <CardHeader>
        <CardTitle>Alerts & Notes</CardTitle>
        <CardDescription>Operational issues and on-route follow-up reminders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No active delivery alerts right now.
          </p>
        ) : (
          items.map((alert) => (
            <div key={alert.key} className="flex items-start gap-3 rounded-xl border bg-background/55 px-3 py-3">
              <DashboardIcon icon={alert.tone === "danger" ? "alert" : "bell"} tone={alert.tone ?? "warning"} className="size-8 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{alert.title}</p>
                {alert.detail ? <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p> : null}
              </div>
              {alert.time ? <span className="shrink-0 text-xs text-muted-foreground">{alert.time}</span> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryQuickActionsCard({ actions }: { actions: DashboardAction[] }) {
  const labelMap: Record<string, string> = {
    "generate-challan": "Generate Challan",
    "confirm-dispatch": "Confirm Dispatch",
    "delivery-status": "Update Delivery Status",
    "stock-check": "Stock Check",
    manifest: "Download Manifest",
  };
  const extendedActions = [
    ...actions,
    { key: "record-returned", label: "Record Returned Item", hint: "Open return queue", href: ROUTES.factoryQueue, icon: "alert" as DashboardIconKey, tone: "danger" as StatusTone },
    { key: "assign-vehicle", label: "Assign Rider / Vehicle", hint: "Coordinate delivery route", href: ROUTES.factoryQueue, icon: "team" as DashboardIconKey, tone: "info" as StatusTone },
    { key: "partial-delivery", label: "Record Partial Delivery", hint: "Update status and notes", href: ROUTES.factoryQueue, icon: "delivery" as DashboardIconKey, tone: "warning" as StatusTone },
  ].slice(0, 8);

  return (
    <Card className="h-full min-h-[280px]">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Fast controls for dispatch and delivery operations.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {extendedActions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3 shadow-[var(--shadow-xs)] transition-colors hover:bg-muted/35"
          >
            <DashboardIcon icon={action.icon} tone={action.tone ?? "neutral"} className="size-9 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{labelMap[action.key] ?? action.label}</p>
              <p className="truncate text-xs text-muted-foreground">{action.hint}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function DeliveryDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [queue, stockReady, returnedFailed] = dashboard.sections;
  const partialDeliveriesKpi: DashboardKpi = {
    key: "partial-deliveries",
    label: "Partial Deliveries",
    value: String(returnedFailed?.rows.length ?? 0),
    hint: "Returned / failed rows",
    detail: "Requires follow-up",
    tone: "warning",
    icon: "delivery",
    href: ROUTES.factoryQueue,
  };
  const deliveryKpis = [
    dashboard.kpis[0],
    dashboard.kpis[1],
    dashboard.kpis[2],
    dashboard.kpis[3],
    partialDeliveriesKpi,
    dashboard.kpis[4],
  ].filter(Boolean) as DashboardKpi[];

  return (
    <div className="space-y-4">
      <DeliveryHero dashboard={dashboard} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {deliveryKpis.map((kpi) => (
          <DeliveryKpiTile key={kpi.key} item={kpi} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_0.88fr]">
        <DeliveryMovementListCard section={queue} title="Delivery Queue" description="Orders ready to move through dispatch and route execution." />
        <DeliveryTableCard section={stockReady} title="Stock Check / Ready for Dispatch" description="Stock, packing, and dispatch readiness across factory queue." />
        <DeliveryStatusSummaryCard dashboard={dashboard} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr_1fr]">
        <DeliveryMovementListCard section={queue} title="Recent Delivery Challans" description="Latest challan-linked movement records and route assignments." actionLabel="View all" />
        <DeliveryScheduleCard section={queue} />
        <DeliveryTableCard section={returnedFailed} title="Returned / Failed Delivery" description="Items requiring retry, return handling, or route correction." actionLabel="View all" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <DeliveryAlertsCard alerts={dashboard.alerts} />
        <DeliveryQuickActionsCard actions={dashboard.actions} />
      </div>
    </div>
  );
}

export function RoleDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  if (dashboard.variant === "ceo") {
    return <CeoDashboard dashboard={dashboard} />;
  }

  if (dashboard.variant === "head_of_sales") {
    return <HosDashboard dashboard={dashboard} />;
  }

  if (dashboard.variant === "division_manager") {
    return <DivisionManagerDashboard dashboard={dashboard} />;
  }

  if (dashboard.variant === "zone_manager") {
    return <ZoneManagerDashboard dashboard={dashboard} />;
  }

  const layoutSpec = getDashboardLayoutSpec(dashboard.variant);

  if (layoutSpec.family === "marketer") {
    return <MarketerDashboard dashboard={dashboard} />;
  }

  if (layoutSpec.family === "accounts") {
    return <AccountsDashboard dashboard={dashboard} />;
  }

  if (layoutSpec.family === "delivery") {
    return <DeliveryDashboard dashboard={dashboard} />;
  }

  return <LeadershipDashboard dashboard={dashboard} />;
}
