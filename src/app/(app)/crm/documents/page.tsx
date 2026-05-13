import { ROUTES } from "@/config/routes";
import { CrmPage } from "@/modules/crm/components/crm-page";
import { DocumentTable } from "@/modules/crm/components/crm-tables";
import { getCrmDocuments } from "@/modules/crm/queries";
import { CRM_DOCUMENT_STATUSES, type CrmListFilters } from "@/modules/crm/types";

export default async function CrmDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<CrmListFilters>;
}) {
  const filters = await searchParams;
  const documents = await getCrmDocuments(filters);

  return (
    <CrmPage
      title="CRM Documents"
      description="Track quotations, proposals, agreements, and customer files."
      newHref={ROUTES.crmDocumentsNew}
      newLabel="New document"
      total={documents.total}
      filters={{ ...filters, statuses: CRM_DOCUMENT_STATUSES }}
    >
      <DocumentTable rows={documents.rows} />
    </CrmPage>
  );
}
