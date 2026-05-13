import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { getCrmCompanies, getCrmPipelineStages } from "@/modules/crm/queries";
import { formatMoney } from "@/modules/crm/normalize";

export default async function CrmPipelinePage() {
  const [stages, companies] = await Promise.all([
    getCrmPipelineStages(),
    getCrmCompanies(),
  ]);

  return (
    <CrmPage
      title="CRM Pipeline"
      description="A compact stage view of active company opportunities."
      total={companies.total}
    >
      <div className="grid gap-4 xl:grid-cols-4">
        {stages.map((stage) => {
          const stageCompanies = companies.rows.filter((company) => company.pipeline_stage_id === stage.id);
          const value = stageCompanies.reduce((total, company) => total + Number(company.estimated_value ?? 0), 0);
          return (
            <Card key={stage.id} className="min-h-56">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    {stage.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{stage.probability}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border bg-muted/20 px-3 py-2 text-sm">
                  <div className="font-semibold">{stageCompanies.length} companies</div>
                  <div className="text-muted-foreground">{formatMoney(value)}</div>
                </div>
                {stageCompanies.slice(0, 5).map((company) => (
                  <div key={company.id} className="rounded-xl border bg-background/70 px-3 py-2 text-sm shadow-[var(--shadow-xs)]">
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs text-muted-foreground">{formatMoney(company.estimated_value)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </CrmPage>
  );
}
