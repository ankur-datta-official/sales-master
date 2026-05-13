import { PageHeader } from "@/components/ui/page-header";
import { CrmDocumentForm } from "@/modules/crm/components/crm-forms";
import { getCrmFormOptions } from "@/modules/crm/queries";

export default async function NewCrmDocumentPage() {
  const options = await getCrmFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader title="New CRM document" description="Record a customer-facing document." />
      <CrmDocumentForm options={options} />
    </div>
  );
}
