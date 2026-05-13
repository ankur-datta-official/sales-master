import { PageHeader } from "@/components/ui/page-header";
import { CrmContactForm } from "@/modules/crm/components/crm-forms";
import { getCrmFormOptions } from "@/modules/crm/queries";

export default async function NewCrmContactPage() {
  const options = await getCrmFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader title="New CRM contact" description="Attach a stakeholder to a CRM company." />
      <CrmContactForm options={options} />
    </div>
  );
}
