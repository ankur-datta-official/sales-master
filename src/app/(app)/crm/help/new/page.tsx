import { PageHeader } from "@/components/ui/page-header";
import { CrmHelpRequestForm } from "@/modules/crm/components/crm-forms";
import { getCrmFormOptions } from "@/modules/crm/queries";

export default async function NewCrmHelpRequestPage() {
  const options = await getCrmFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader title="New CRM help request" description="Ask the right teammate for support." />
      <CrmHelpRequestForm options={options} />
    </div>
  );
}
