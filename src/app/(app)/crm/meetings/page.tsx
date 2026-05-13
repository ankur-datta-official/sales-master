import { ROUTES } from "@/config/routes";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { InteractionTable } from "@/modules/crm/components/crm-tables";
import { getCrmInteractions } from "@/modules/crm/queries";
import { CRM_RECORD_STATUSES, type CrmListFilters } from "@/modules/crm/types";

export default async function CrmMeetingsPage({
  searchParams,
}: {
  searchParams: Promise<CrmListFilters>;
}) {
  const filters = await searchParams;
  const meetings = await getCrmInteractions(filters);

  return (
    <CrmPage
      title="CRM Meetings"
      description="Log customer calls, meetings, demos, and relationship-building activity."
      newHref={ROUTES.crmMeetingsNew}
      newLabel="New meeting"
      total={meetings.total}
      filters={{ ...filters, statuses: CRM_RECORD_STATUSES }}
    >
      <InteractionTable rows={meetings.rows} />
    </CrmPage>
  );
}
