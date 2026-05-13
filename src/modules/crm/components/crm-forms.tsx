import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import {
  createCrmCompanyAction,
  createCrmContactAction,
  createCrmDocumentAction,
  createCrmFollowupAction,
  createCrmHelpRequestAction,
  createCrmInteractionAction,
} from "@/modules/crm/actions";
import {
  CompanySelect,
  ContactSelect,
  SelectField,
  TeamMemberSelect,
  TextAreaField,
  TextField,
} from "@/modules/crm/components/crm-fields";
import {
  CRM_DOCUMENT_STATUSES,
  CRM_DOCUMENT_TYPES,
  CRM_FOLLOWUP_STATUSES,
  CRM_FOLLOWUP_TYPES,
  CRM_HELP_STATUSES,
  CRM_HELP_TYPES,
  CRM_INTERACTION_TYPES,
  CRM_LEAD_TEMPERATURES,
  CRM_PRIORITIES,
  CRM_RECORD_STATUSES,
  type CrmFormOptions,
} from "@/modules/crm/types";

function FormShell({
  title,
  description,
  action,
  cancelHref,
  children,
}: {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit">Save</Button>
          <Link
            href={cancelHref}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export function CrmCompanyForm({ options }: { options: CrmFormOptions }) {
  return (
    <FormShell
      title="New CRM company"
      description="Create a company or lead inside the Sales Master CRM module."
      action={createCrmCompanyAction}
      cancelHref={ROUTES.crmCompanies}
    >
      <TextField name="name" label="Company name" required />
      <SelectField
        name="pipeline_stage_id"
        label="Pipeline stage"
        options={options.pipelineStages.map((stage) => ({ value: stage.id, label: stage.name }))}
        emptyLabel="No stage"
      />
      <SelectField name="priority" label="Priority" options={CRM_PRIORITIES} defaultValue="medium" />
      <SelectField name="lead_temperature" label="Lead temperature" options={CRM_LEAD_TEMPERATURES} defaultValue="warm" />
      <TeamMemberSelect options={options} />
      <SelectField name="status" label="Status" options={CRM_RECORD_STATUSES} defaultValue="active" />
      <TextField name="phone" label="Phone" />
      <TextField name="email" label="Email" type="email" />
      <TextField name="website" label="Website" type="url" />
      <TextField name="lead_source" label="Lead source" />
      <TextField name="estimated_value" label="Estimated value" type="number" />
      <TextField name="expected_closing_date" label="Expected closing date" type="date" />
      <TextField name="city" label="City" />
      <TextField name="country" label="Country" />
      <div className="md:col-span-2">
        <TextAreaField name="address" label="Address" />
      </div>
      <div className="md:col-span-2">
        <TextAreaField name="notes" label="Notes" />
      </div>
    </FormShell>
  );
}

export function CrmContactForm({ options }: { options: CrmFormOptions }) {
  return (
    <FormShell
      title="New CRM contact"
      description="Attach a person, decision maker, or stakeholder to a CRM company."
      action={createCrmContactAction}
      cancelHref={ROUTES.crmContacts}
    >
      <CompanySelect options={options} />
      <TextField name="name" label="Contact name" required />
      <TextField name="designation" label="Designation" />
      <TextField name="department" label="Department" />
      <TextField name="mobile" label="Mobile" />
      <TextField name="whatsapp" label="WhatsApp" />
      <TextField name="email" label="Email" type="email" />
      <TextField name="decision_role" label="Decision role" />
      <TextField name="relationship_level" label="Relationship level" />
      <TextField name="preferred_contact_method" label="Preferred contact method" />
      <SelectField name="status" label="Status" options={CRM_RECORD_STATUSES} defaultValue="active" />
      <label className="flex items-center gap-2 pt-7 text-sm">
        <input name="is_primary" type="checkbox" className="size-4 rounded border-input" />
        Primary contact
      </label>
      <div className="md:col-span-2">
        <TextAreaField name="remarks" label="Remarks" />
      </div>
    </FormShell>
  );
}

export function CrmInteractionForm({ options }: { options: CrmFormOptions }) {
  return (
    <FormShell
      title="New CRM meeting"
      description="Record a call, meeting, discussion, demo, or other customer interaction."
      action={createCrmInteractionAction}
      cancelHref={ROUTES.crmMeetings}
    >
      <CompanySelect options={options} />
      <ContactSelect options={options} />
      <TeamMemberSelect options={options} />
      <SelectField name="interaction_type" label="Type" options={CRM_INTERACTION_TYPES} defaultValue="Phone Call" />
      <TextField name="meeting_at" label="Meeting time" type="datetime-local" required />
      <TextField name="location" label="Location" />
      <TextField name="online_meeting_link" label="Online meeting link" type="url" />
      <SelectField name="status" label="Status" options={CRM_RECORD_STATUSES} defaultValue="active" />
      <div className="md:col-span-2">
        <TextAreaField name="discussion_details" label="Discussion details" required />
      </div>
      <TextField name="next_action" label="Next action" />
      <TextField name="next_followup_at" label="Next follow-up time" type="datetime-local" />
      <label className="flex items-center gap-2 pt-7 text-sm">
        <input name="need_help" type="checkbox" className="size-4 rounded border-input" />
        Need management help
      </label>
    </FormShell>
  );
}

export function CrmFollowupForm({ options }: { options: CrmFormOptions }) {
  return (
    <FormShell
      title="New CRM follow-up"
      description="Schedule the next customer touchpoint and keep ownership clear."
      action={createCrmFollowupAction}
      cancelHref={ROUTES.crmFollowups}
    >
      <CompanySelect options={options} />
      <ContactSelect options={options} />
      <TeamMemberSelect options={options} />
      <SelectField name="followup_type" label="Type" options={CRM_FOLLOWUP_TYPES} defaultValue="Phone Call" />
      <TextField name="title" label="Title" required />
      <TextField name="scheduled_at" label="Scheduled time" type="datetime-local" required />
      <SelectField name="priority" label="Priority" options={CRM_PRIORITIES} defaultValue="medium" />
      <SelectField name="status" label="Status" options={CRM_FOLLOWUP_STATUSES} defaultValue="pending" />
      <div className="md:col-span-2">
        <TextAreaField name="description" label="Description" />
      </div>
    </FormShell>
  );
}

export function CrmDocumentForm({ options }: { options: CrmFormOptions }) {
  return (
    <FormShell
      title="New CRM document"
      description="Track quotations, proposals, agreements, and shared customer files."
      action={createCrmDocumentAction}
      cancelHref={ROUTES.crmDocuments}
    >
      <CompanySelect options={options} />
      <SelectField name="document_type" label="Document type" options={CRM_DOCUMENT_TYPES} defaultValue="Other" />
      <TextField name="title" label="Title" required />
      <TextField name="file_name" label="File name" />
      <TextField name="file_url" label="File URL" type="url" />
      <SelectField name="status" label="Status" options={CRM_DOCUMENT_STATUSES} defaultValue="draft" />
      <div className="md:col-span-2">
        <TextAreaField name="description" label="Description" />
      </div>
      <div className="md:col-span-2">
        <TextAreaField name="remarks" label="Remarks" />
      </div>
    </FormShell>
  );
}

export function CrmHelpRequestForm({ options }: { options: CrmFormOptions }) {
  return (
    <FormShell
      title="New CRM help request"
      description="Ask for senior, technical, price, proposal, or follow-up support."
      action={createCrmHelpRequestAction}
      cancelHref={ROUTES.crmHelp}
    >
      <CompanySelect options={options} />
      <TeamMemberSelect options={options} />
      <SelectField name="help_type" label="Help type" options={CRM_HELP_TYPES} defaultValue="General Support" />
      <TextField name="title" label="Title" required />
      <SelectField name="priority" label="Priority" options={CRM_PRIORITIES} defaultValue="medium" />
      <SelectField name="status" label="Status" options={CRM_HELP_STATUSES} defaultValue="open" />
      <div className="md:col-span-2">
        <TextAreaField name="description" label="Description" />
      </div>
    </FormShell>
  );
}
