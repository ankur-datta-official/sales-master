import { PageHeader } from "@/components/ui/page-header";
import { CrmCompanyForm } from "@/modules/crm/components/crm-forms";
import { getCrmFormOptions } from "@/modules/crm/queries";

export default async function NewCrmCompanyPage() {
  const options = await getCrmFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader title="New CRM company" description="Create a lead or customer account." />
      <CrmCompanyForm options={options} />
    </div>
  );
}
