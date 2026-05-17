import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canViewWorkspaceMonthlyBudget } from "@/lib/users/actor-permissions";
import { getMonthlyBudgetSnapshot } from "@/modules/workspace-insights/service";
import { redirect } from "next/navigation";

function fmtMoney(value: number): string {
  return `Tk ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)}`;
}

export default async function MonthlyBudgetPage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewWorkspaceMonthlyBudget(role)) {
    redirect(ROUTES.dashboard);
  }
  const supabase = await createClient();
  const budget = await getMonthlyBudgetSnapshot({
    supabase,
    role,
    userId: profile?.id ?? user.id,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Monthly Budget"
        description={budget.semanticLabel}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Allocated", value: fmtMoney(budget.allocated), tone: "info" as const },
          { label: "Utilized", value: fmtMoney(budget.utilized), tone: "success" as const },
          { label: "Remaining", value: fmtMoney(budget.remaining), tone: budget.remaining > 0 ? "warning" as const : "success" as const },
          { label: "Utilization", value: `${budget.utilizationPercent}%`, tone: "info" as const },
        ].map((item) => (
          <Card key={item.label} className="py-0">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
                <StatusBadge tone={item.tone}>{budget.scopeLabel}</StatusBadge>
              </div>
              <p className="text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Target Allocation</CardTitle>
            <CardDescription>Sales and collection targets form the current month allocation model.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Sales target</span>
                <span className="font-mono">{fmtMoney(budget.salesTarget)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, budget.utilizationPercent)}%` }} />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Sales achieved</span>
                <span>{fmtMoney(budget.salesActual)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Collection target</span>
                <span className="font-mono">{fmtMoney(budget.collectionTarget)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${budget.collectionTarget > 0 ? Math.min(100, Math.round((budget.collectionActual / budget.collectionTarget) * 100)) : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Collection achieved</span>
                <span>{fmtMoney(budget.collectionActual)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Snapshot</CardTitle>
            <CardDescription>Open order pressure often explains why utilization and collection pace move apart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-background/45 px-3 py-3">
              <span>Active orders</span>
              <span className="font-semibold">{budget.activeOrders}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-background/45 px-3 py-3">
              <span>Pending orders</span>
              <span className="font-semibold">{budget.pendingOrders}</span>
            </div>
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              This page stays operational on purpose. It explains target allocation, receivable pressure, and pipeline utilization without pretending to be a full finance ledger.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
