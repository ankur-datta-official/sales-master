import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getDashboardData } from "@/modules/dashboard/service";

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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Role-aware operational summary for your current visibility scope.
      </p>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
          <CardDescription>Session summary from your profile and current role.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{displayName}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium font-mono text-xs">
                {role ?? "— (resolve from roles/profile data or JWT metadata)"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.summary_cards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            {card.hint ? (
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-xs">{card.hint}</p>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick widgets</CardTitle>
          <CardDescription>Fast actions and queue shortcuts for your role.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.quick_widgets.map((w) => (
              <Link
                key={w.key}
                href={w.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto min-h-16 flex-col items-start justify-center px-3 py-2 text-left"
                )}
              >
                <span className="font-medium">{w.label}</span>
                {w.value ? <span className="text-muted-foreground text-xs">{w.value}</span> : null}
                {w.hint ? <span className="text-muted-foreground text-xs">{w.hint}</span> : null}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent work reports</CardTitle>
            <CardDescription>Latest report submissions visible to you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.recent_work_reports.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent work reports.</p>
            ) : (
              dashboard.recent_work_reports.map((r) => (
                <Link
                  key={r.id}
                  href={`${ROUTES.workReports}/${r.id}`}
                  className="block rounded-md border p-2 hover:bg-muted/40"
                >
                  <p className="text-sm font-medium">{r.summary}</p>
                  <p className="text-muted-foreground text-xs">
                    {r.report_date} · {r.status}
                    {r.owner_name ? ` · ${r.owner_name}` : ""}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Newest demand orders in your scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.recent_orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent orders.</p>
            ) : (
              dashboard.recent_orders.map((o) => (
                <Link
                  key={o.id}
                  href={`${ROUTES.demandOrders}/${o.id}`}
                  className="block rounded-md border p-2 hover:bg-muted/40"
                >
                  <p className="text-sm font-medium">
                    {o.party_name ?? "Demand order"} · {o.total_amount}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {o.order_date} · {o.status} / {o.stage}
                    {o.owner_name ? ` · ${o.owner_name}` : ""}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest approval and workflow events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.recent_activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity.</p>
            ) : (
              dashboard.recent_activity.map((a) => (
                <div key={a.id} className="rounded-md border p-2">
                  <p className="text-sm font-medium capitalize">{a.action.replaceAll("_", " ")}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(a.at).toLocaleString()}
                    {a.actor_name ? ` · ${a.actor_name}` : ""}
                  </p>
                  {a.note ? <p className="text-muted-foreground mt-1 text-xs">{a.note}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
