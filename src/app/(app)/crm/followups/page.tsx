import { ROUTES } from "@/config/routes";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { FollowupTable } from "@/modules/crm/components/crm-tables";
import { getCrmFollowups } from "@/modules/crm/queries";
import { CRM_FOLLOWUP_STATUSES, CRM_PRIORITIES, type CrmListFilters } from "@/modules/crm/types";

export default async function CrmFollowupsPage({
  searchParams,
}: {
  searchParams: Promise<CrmListFilters>;
}) {
  const filters = await searchParams;
  const followups = await getCrmFollowups(filters);

  return (
    <CrmPage
      title="CRM Follow-ups"
      description="Keep the next touchpoint visible, assigned, and timed."
      newHref={ROUTES.crmFollowupsNew}
      newLabel="New follow-up"
      total={followups.total}
      filters={{ ...filters, statuses: CRM_FOLLOWUP_STATUSES, priorities: CRM_PRIORITIES }}
    >
      <FollowupTable rows={followups.rows} />
    </CrmPage>
  );
}
