import { ROUTES } from "@/config/routes";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { HelpRequestTable } from "@/modules/crm/components/crm-tables";
import { getCrmHelpRequests } from "@/modules/crm/queries";
import { CRM_HELP_STATUSES, CRM_PRIORITIES, type CrmListFilters } from "@/modules/crm/types";

export default async function CrmHelpPage({
  searchParams,
}: {
  searchParams: Promise<CrmListFilters>;
}) {
  const filters = await searchParams;
  const helpRequests = await getCrmHelpRequests(filters);

  return (
    <CrmPage
      title="CRM Help"
      description="Coordinate senior, technical, quotation, and payment-follow-up support."
      newHref={ROUTES.crmHelpNew}
      newLabel="New request"
      total={helpRequests.total}
      filters={{ ...filters, statuses: CRM_HELP_STATUSES, priorities: CRM_PRIORITIES }}
    >
      <HelpRequestTable rows={helpRequests.rows} />
    </CrmPage>
  );
}
