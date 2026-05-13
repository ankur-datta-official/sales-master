import { PageHeader } from "@/components/ui/page-header";
import { CrmFollowupForm } from "@/modules/crm/components/crm-forms";
import { getCrmFormOptions } from "@/modules/crm/queries";

export default async function NewCrmFollowupPage() {
  const options = await getCrmFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader title="New CRM follow-up" description="Schedule the next customer action." />
      <CrmFollowupForm options={options} />
    </div>
  );
}
