import { ROUTES } from "@/config/routes";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { ContactTable } from "@/modules/crm/components/crm-tables";
import { getCrmContacts } from "@/modules/crm/queries";
import { CRM_RECORD_STATUSES, type CrmListFilters } from "@/modules/crm/types";

export default async function CrmContactsPage({
  searchParams,
}: {
  searchParams: Promise<CrmListFilters>;
}) {
  const filters = await searchParams;
  const contacts = await getCrmContacts(filters);

  return (
    <CrmPage
      title="CRM Contacts"
      description="Keep decision makers and stakeholders connected to the right company."
      newHref={ROUTES.crmContactsNew}
      newLabel="New contact"
      total={contacts.total}
      filters={{ ...filters, statuses: CRM_RECORD_STATUSES }}
    >
      <ContactTable rows={contacts.rows} />
    </CrmPage>
  );
}
