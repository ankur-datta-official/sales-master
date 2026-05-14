import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CrmFormOptions } from "@/modules/crm/types";

export const nativeSelectClass = cn(
  "flex h-10 w-full rounded-xl border border-input bg-background/60 px-3 py-1 text-sm shadow-[var(--shadow-xs)] outline-none",
  "focus-visible:border-ring focus-visible:bg-background/85 focus-visible:ring-3 focus-visible:ring-ring/35",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function TextField({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Input name={name} type={type} required={required} placeholder={placeholder} />
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <Textarea name={name} rows={4} required={required} />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
  required,
  emptyLabel = "Select one",
  defaultValue = "",
}: {
  name: string;
  label: string;
  options: readonly string[] | Array<{ value: string; label: string }>;
  required?: boolean;
  emptyLabel?: string;
  defaultValue?: string;
}) {
  return (
    <Field label={label}>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={nativeSelectClass}
      >
        {!required ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function CompanySelect({ options }: { options: CrmFormOptions }) {
  return (
    <SelectField
      name="company_id"
      label="Company"
      required
      options={options.companies.map((company) => ({
        value: company.id,
        label: company.name,
      }))}
    />
  );
}

export function ContactSelect({ options }: { options: CrmFormOptions }) {
  return (
    <SelectField
      name="contact_id"
      label="Contact"
      emptyLabel="No contact"
      options={options.contacts.map((contact) => ({
        value: contact.id,
        label: contact.name,
      }))}
    />
  );
}

export function TeamMemberSelect({ options }: { options: CrmFormOptions }) {
  return (
    <SelectField
      name="assigned_to_user_id"
      label="Assigned to"
      emptyLabel="Unassigned"
      options={options.teamMembers.map((member) => ({
        value: member.id,
        label: member.full_name ?? member.email ?? "Unnamed user",
      }))}
    />
  );
}
