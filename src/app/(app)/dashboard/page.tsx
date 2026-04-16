import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getDashboardData } from "@/modules/dashboard/service";
import {
  Activity,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Factory,
  LineChart,
  ShoppingCart,
  Target,
  Users,
  WalletMinimal,
} from "lucide-react";

function titleCaseFromKey(value: string) {
  return value
    .replaceAll("_", " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function toneFromStatus(value: string): StatusTone {
  const v = value.toLowerCase();
  if (v.includes("approved") || v.includes("paid") || v.includes("verified")) return "success";
  if (v.includes("rejected") || v.includes("failed") || v.includes("cancel")) return "danger";
  if (v.includes("submitted") || v.includes("under")) return "info";
  if (v.includes("draft") || v.includes("pending")) return "warning";
  return "neutral";
}

function iconForKpi(key: string) {
  if (key.includes("today_sales")) return <WalletMinimal />;
  if (key.includes("today_collections")) return <Banknote />;
  if (key.includes("active_field_users")) return <Users />;
  if (key.includes("pending_approvals")) return <BadgeCheck />;
  if (key.includes("pending_accounts_review")) return <BadgeCheck />;
  if (key.includes("factory_queue") || key.includes("ready_to_dispatch")) return <Factory />;
  if (key.includes("active_targets")) return <Target />;
  if (key.includes("attendance")) return <CalendarClock />;
  return <LineChart />;
}

function QuickWidgetLink({
  label,
  href,
  value,
  hint,
}: {
  label: string;
  href: string;
  value?: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/75 px-4 py-3 text-left",
        "shadow-[var(--shadow-sm)] transition-[transform,background-color,box-shadow] hover:-translate-y-px hover:bg-card hover:shadow-[var(--shadow-md)]",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/45 to-transparent opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{label}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {value ? (
          <div className="shrink-0 text-right">
            <p className="text-xl font-semibold tabular-nums tracking-tight">{value}</p>
          </div>
        ) : null}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent opacity-60"
      />
    </Link>
  );
}

function ListRow({
  title,
  subtitle,
  href,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  href?: string;
  right?: ReactNode;
}) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium tracking-tight">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );

  const className = cn(
    "group block px-3 py-3 transition-colors",
    "hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

export default async function DashboardPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const displayName = getUserDisplayName(profile, user);
  const supabase = await createClient();
  const dashboard = await getDashboardData({
    supabase,
    role,
    userId: profile?.id ?? user.id,
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-card/75 shadow-[var(--shadow-md)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/12 blur-3xl"
        />
        <div className="relative p-4 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="info" className="hidden sm:inline-flex">
                  {role ?? "role: unknown"}
                </StatusBadge>
                <StatusBadge tone="neutral" className="hidden sm:inline-flex">
                  Control center
                </StatusBadge>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Signed in as <span className="text-foreground/90">{displayName}</span>
              </p>
              <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                Executive Dashboard
              </h1>
              <p className="mt-1 max-w-[80ch] text-sm leading-relaxed text-muted-foreground">
                Your operational snapshot across sales, collections, workflow queues, and field activity—scoped to your access.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={ROUTES.demandOrdersNew}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9")}
              >
                <ShoppingCart />
                New order
              </Link>
              <Link
                href={ROUTES.workReportsNew}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
              >
                <Activity />
                New report
              </Link>
              <Link
                href={ROUTES.analytics}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9")}
              >
                <LineChart />
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {dashboard.warnings.length > 0 ? (
        <div className="rounded-xl border bg-card/60 p-3 shadow-[var(--shadow-xs)]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="warning">Notice</StatusBadge>
            <p className="text-sm text-foreground/90">
              Some widgets are temporarily unavailable.
            </p>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {dashboard.warnings.map((w) => (
              <li key={w} className="leading-relaxed">
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dashboard.summary_cards.map((card, idx) => {
              const tone =
                card.key.includes("pending") || card.key.includes("queue")
                  ? "warning"
                  : card.key.includes("today")
                    ? "info"
                    : card.key.includes("attendance")
                      ? "neutral"
                      : "neutral";

              const featured = idx < 2;
              return (
                <KpiCard
                  key={card.key}
                  label={card.label}
                  value={card.value}
                  hint={card.hint}
                  tone={tone}
                  badge={card.key.includes("pending") ? "Queue" : undefined}
                  icon={iconForKpi(card.key)}
                  className={cn(
                    featured && "sm:col-span-2 xl:col-span-2",
                    featured && "bg-card/85 shadow-[var(--shadow-md)]"
                  )}
                />
              );
            })}
          </div>

          <SectionCard
            title="Quick actions"
            description="High-frequency controls and queue shortcuts for your role."
            contentClassName="space-y-0"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dashboard.quick_widgets.map((w) => (
                <QuickWidgetLink
                  key={w.key}
                  label={w.label}
                  href={w.href}
                  value={w.value}
                  hint={w.hint}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        <Card className="h-fit overflow-hidden bg-card/75 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base tracking-tight">Scope</CardTitle>
            <CardDescription>Identity and access context.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">User</dt>
                <dd className="font-medium truncate">{displayName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-mono text-xs">
                  {role ?? "— (resolve from roles/profile data or JWT metadata)"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-2">
              <Link
                href={ROUTES.profile}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 justify-start")}
              >
                Profile
              </Link>
              <Link
                href={ROUTES.visitLogs}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 justify-start")}
              >
                Activity logs
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Recent work reports"
          description="Latest report submissions visible to you."
          contentClassName="space-y-0"
        >
          {dashboard.recent_work_reports.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent work reports.</p>
          ) : (
            <div className="divide-y rounded-xl border bg-background/40">
              {dashboard.recent_work_reports.map((r) => (
                <ListRow
                  key={r.id}
                  href={`${ROUTES.workReports}/${r.id}`}
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-foreground/10">
                        <Activity className="size-4" />
                      </span>
                      <span className="truncate">{r.summary}</span>
                    </span>
                  }
                  subtitle={
                    <>
                      {r.owner_name ? `${r.owner_name} · ` : ""}
                      <span className="font-mono">{r.report_date}</span>
                    </>
                  }
                  right={
                    <StatusBadge tone={toneFromStatus(r.status)} size="sm">
                      {titleCaseFromKey(r.status)}
                    </StatusBadge>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent demand orders"
          description="Newest demand orders in your scope."
          contentClassName="space-y-0"
        >
          {dashboard.recent_orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent orders.</p>
          ) : (
            <div className="divide-y rounded-xl border bg-background/40">
              {dashboard.recent_orders.map((o) => (
                <ListRow
                  key={o.id}
                  href={`${ROUTES.demandOrders}/${o.id}`}
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-foreground/10">
                        <ShoppingCart className="size-4" />
                      </span>
                      <span className="truncate">
                        {o.party_name ?? "Demand order"}
                        <span className="text-muted-foreground"> · </span>
                        <span className="font-mono text-xs">{o.total_amount}</span>
                      </span>
                    </span>
                  }
                  subtitle={
                    <>
                      {o.owner_name ? `${o.owner_name} · ` : ""}
                      <span className="font-mono">{o.order_date}</span>
                    </>
                  }
                  right={
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge tone={toneFromStatus(o.status)} size="sm">
                        {titleCaseFromKey(o.status)}
                      </StatusBadge>
                      <StatusBadge tone="neutral" size="sm" className="font-mono">
                        {o.stage}
                      </StatusBadge>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="Latest approval and workflow events."
          contentClassName="space-y-0"
        >
          {dashboard.recent_activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity.</p>
          ) : (
            <div className="divide-y rounded-xl border bg-background/40">
              {dashboard.recent_activity.map((a) => (
                <ListRow
                  key={a.id}
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-foreground/10">
                        <BadgeCheck className="size-4" />
                      </span>
                      <span className="truncate">{titleCaseFromKey(a.action)}</span>
                    </span>
                  }
                  subtitle={
                    <>
                      <span className="font-mono">{new Date(a.at).toLocaleString()}</span>
                      {a.actor_name ? ` · ${a.actor_name}` : ""}
                      {a.note ? ` · ${a.note}` : ""}
                    </>
                  }
                  right={
                    <StatusBadge tone="neutral" size="sm">
                      Event
                    </StatusBadge>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
