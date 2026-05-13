import { PageHeader } from "@/components/ui/page-header";
import { CrmInteractionForm } from "@/modules/crm/components/crm-forms";
import { getCrmFormOptions } from "@/modules/crm/queries";

export default async function NewCrmMeetingPage() {
  const options = await getCrmFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader title="New CRM meeting" description="Record a customer interaction." />
      <CrmInteractionForm options={options} />
    </div>
  );
}
