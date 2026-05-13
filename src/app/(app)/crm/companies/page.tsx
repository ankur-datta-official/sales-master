import { ROUTES } from "@/config/routes";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { CompanyTable } from "@/modules/crm/components/crm-tables";
import { getCrmCompanies } from "@/modules/crm/queries";
import { CRM_PRIORITIES, CRM_RECORD_STATUSES, type CrmListFilters } from "@/modules/crm/types";

export default async function CrmCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<CrmListFilters>;
}) {
  const filters = await searchParams;
  const companies = await getCrmCompanies(filters);

  return (
    <CrmPage
      title="CRM Companies"
      description="Track every prospect, buyer, and relationship from one Sales Master workspace."
      newHref={ROUTES.crmCompaniesNew}
      newLabel="New company"
      total={companies.total}
      filters={{ ...filters, statuses: CRM_RECORD_STATUSES, priorities: CRM_PRIORITIES }}
    >
      <CompanyTable rows={companies.rows} />
    </CrmPage>
  );
}
