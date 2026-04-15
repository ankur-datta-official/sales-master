import Link from "next/link";
import { redirect } from "next/navigation";

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
import { canViewAnalytics } from "@/lib/users/actor-permissions";
import { cn } from "@/lib/utils";
import { analyticsFiltersSchema } from "@/modules/analytics/schemas";
import { getAnalyticsBasicsData } from "@/modules/analytics/service";

type PageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    scope?: string;
    user?: string;
    party?: string;
  }>;
};

function formatNum(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = analyticsFiltersSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : analyticsFiltersSchema.parse({});

  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewAnalytics(role)) {
    redirect(ROUTES.dashboard);
  }

  const supabase = await createClient();
  const { data: partyOptions } = await supabase
    .from("parties")
    .select("id, name")
    .order("name", { ascending: true })
    .limit(200);

  const analytics = await getAnalyticsBasicsData({
    supabase,
    role,
    userId: profile?.id ?? user.id,
    filters,
  });

  const canTeamScope =
    role === "admin" || role === "hos" || role === "manager" || role === "assistant_manager";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Lightweight operational analytics by role and hierarchy visibility.
          </p>
        </div>
        <Link
          href={ROUTES.dashboard}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-9 items-center px-4")}
        >
          Dashboard
        </Link>
      </div>

      <form className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-6">
        <input
          name="dateFrom"
          type="date"
          defaultValue={filters.dateFrom}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <input
          name="dateTo"
          type="date"
          defaultValue={filters.dateTo}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
        <select
          name="scope"
          defaultValue={canTeamScope ? filters.scope : "own"}
          disabled={!canTeamScope}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none disabled:opacity-60"
        >
          <option value="own">Own</option>
          <option value="team">Team</option>
        </select>
        <input
          name="user"
          placeholder="User id"
          defaultValue={canTeamScope ? filters.user : ""}
          disabled={!canTeamScope}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none disabled:opacity-60"
        />
        <select
          name="party"
          defaultValue={filters.party}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          <option value="">All parties</option>
          {(partyOptions ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        >
          Apply
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.summary_cards.map((card) => (
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
          <CardDescription>Compact analytics references for current role.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {analytics.quick_widgets.map((w) => (
              <div key={w.key} className="rounded-md border p-3">
                <p className="text-sm font-medium">{w.label}</p>
                <p className="text-xl font-semibold">{w.value}</p>
                {w.hint ? <p className="text-muted-foreground text-xs">{w.hint}</p> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {analytics.sales_trend ? (
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>Chart-ready daily totals for selected range.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">Total: {formatNum(analytics.sales_trend.total_amount)}</p>
              {analytics.sales_trend.points.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sales trend points.</p>
              ) : (
                <div className="max-h-56 overflow-auto rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.sales_trend.points.map((p) => (
                        <tr key={p.date} className="border-b last:border-0">
                          <td className="px-3 py-2 font-mono text-xs">{p.date}</td>
                          <td className="px-3 py-2 font-mono text-xs">{formatNum(p.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {analytics.collection_trend ? (
          <Card>
            <CardHeader>
              <CardTitle>Collection Trend</CardTitle>
              <CardDescription>Chart-ready daily collection totals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">Total: {formatNum(analytics.collection_trend.total_amount)}</p>
              {analytics.collection_trend.points.length === 0 ? (
                <p className="text-muted-foreground text-sm">No collection trend points.</p>
              ) : (
                <div className="max-h-56 overflow-auto rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.collection_trend.points.map((p) => (
                        <tr key={p.date} className="border-b last:border-0">
                          <td className="px-3 py-2 font-mono text-xs">{p.date}</td>
                          <td className="px-3 py-2 font-mono text-xs">{formatNum(p.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {analytics.target_vs_actual ? (
          <Card>
            <CardHeader>
              <CardTitle>Target vs Actual</CardTitle>
              <CardDescription>Simple target coverage summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Sales: <span className="font-mono">{formatNum(analytics.target_vs_actual.sales_actual)}</span> /{" "}
                <span className="font-mono">{formatNum(analytics.target_vs_actual.sales_target)}</span>
              </p>
              <p>
                Collections:{" "}
                <span className="font-mono">{formatNum(analytics.target_vs_actual.collection_actual)}</span> /{" "}
                <span className="font-mono">{formatNum(analytics.target_vs_actual.collection_target)}</span>
              </p>
            </CardContent>
          </Card>
        ) : null}

        {analytics.attendance_summary ? (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Lightweight operational attendance counts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Active now: <span className="font-mono">{analytics.attendance_summary.active_now}</span></p>
              <p>Checked in today: <span className="font-mono">{analytics.attendance_summary.checked_in_today}</span></p>
              <p>Checked out today: <span className="font-mono">{analytics.attendance_summary.checked_out_today}</span></p>
              <p>Missed checkout: <span className="font-mono">{analytics.attendance_summary.missed_checkout}</span></p>
            </CardContent>
          </Card>
        ) : null}

        {analytics.order_pipeline_summary ? (
          <Card>
            <CardHeader>
              <CardTitle>Order Pipeline Summary</CardTitle>
              <CardDescription>Stage/status counts for demand orders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Draft: <span className="font-mono">{analytics.order_pipeline_summary.draft}</span></p>
              <p>Manager review: <span className="font-mono">{analytics.order_pipeline_summary.manager_review}</span></p>
              <p>Accounts review: <span className="font-mono">{analytics.order_pipeline_summary.accounts_review}</span></p>
              <p>Factory queue: <span className="font-mono">{analytics.order_pipeline_summary.factory_queue}</span></p>
              <p>Sent to factory: <span className="font-mono">{analytics.order_pipeline_summary.sent_to_factory}</span></p>
              <p>Rejected: <span className="font-mono">{analytics.order_pipeline_summary.rejected}</span></p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
