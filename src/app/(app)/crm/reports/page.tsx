import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { formatMoney } from "@/modules/crm/normalize";
import { getCrmReportSummary } from "@/modules/crm/queries";

const summaryItems = [
  ["companies", "Companies"],
  ["contacts", "Contacts"],
  ["meetings", "Meetings"],
  ["pendingFollowups", "Pending follow-ups"],
  ["openHelpRequests", "Open help requests"],
] as const;

export default async function CrmReportsPage() {
  const summary = await getCrmReportSummary();

  return (
    <CrmPage
      title="CRM Reports"
      description="A focused snapshot of relationship work inside Sales Master."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryItems.map(([key, label]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{summary[key]}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pipeline value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{formatMoney(summary.pipelineValue)}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on visible active companies in the current CRM scope.
          </p>
        </CardContent>
      </Card>
    </CrmPage>
  );
}
