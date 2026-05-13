import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableTable,
} from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  crmStatusTone,
  formatDate,
  formatDateTime,
  formatMoney,
  labelize,
  personLabel,
} from "@/modules/crm/normalize";
import type {
  CrmCompany,
  CrmContact,
  CrmDocument,
  CrmFollowup,
  CrmHelpRequest,
  CrmInteraction,
} from "@/modules/crm/types";

export function CompanyTable({ rows }: { rows: CrmCompany[] }) {
  return (
    <DataTable>
      <DataTableTable>
        <DataTableHead>
          <tr>
            <DataTableHeaderCell>Company / lead</DataTableHeaderCell>
            <DataTableHeaderCell>Pipeline</DataTableHeaderCell>
            <DataTableHeaderCell>Assigned</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell align="right">Value</DataTableHeaderCell>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={5}>No CRM companies found.</DataTableEmptyRow>
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.email ?? row.phone ?? "No primary contact"}</div>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: row.pipeline_stage?.color ?? "#64748b" }} />
                    {row.pipeline_stage?.name ?? "No stage"}
                  </div>
                </DataTableCell>
                <DataTableCell>{personLabel(row.assignee)}</DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.status)}>{labelize(row.status)}</StatusBadge>
                </DataTableCell>
                <DataTableCell align="right">{formatMoney(row.estimated_value)}</DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTableTable>
    </DataTable>
  );
}

export function ContactTable({ rows }: { rows: CrmContact[] }) {
  return (
    <DataTable>
      <DataTableTable>
        <DataTableHead>
          <tr>
            <DataTableHeaderCell>Contact</DataTableHeaderCell>
            <DataTableHeaderCell>Company</DataTableHeaderCell>
            <DataTableHeaderCell>Mobile</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={4}>No CRM contacts found.</DataTableEmptyRow>
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.designation ?? row.email ?? "No designation"}</div>
                </DataTableCell>
                <DataTableCell>{row.company?.name ?? "Unknown company"}</DataTableCell>
                <DataTableCell>{row.mobile ?? row.whatsapp ?? "Not set"}</DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.status)}>{labelize(row.status)}</StatusBadge>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTableTable>
    </DataTable>
  );
}

export function InteractionTable({ rows }: { rows: CrmInteraction[] }) {
  return (
    <DataTable>
      <DataTableTable>
        <DataTableHead>
          <tr>
            <DataTableHeaderCell>Meeting</DataTableHeaderCell>
            <DataTableHeaderCell>Company</DataTableHeaderCell>
            <DataTableHeaderCell>Assigned</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={4}>No CRM meetings found.</DataTableEmptyRow>
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>
                  <div className="font-medium">{row.interaction_type}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(row.meeting_at)}</div>
                </DataTableCell>
                <DataTableCell>{row.company?.name ?? "Unknown company"}</DataTableCell>
                <DataTableCell>{personLabel(row.assignee)}</DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.status)}>{labelize(row.status)}</StatusBadge>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTableTable>
    </DataTable>
  );
}

export function FollowupTable({ rows }: { rows: CrmFollowup[] }) {
  return (
    <DataTable>
      <DataTableTable>
        <DataTableHead>
          <tr>
            <DataTableHeaderCell>Follow-up</DataTableHeaderCell>
            <DataTableHeaderCell>Company</DataTableHeaderCell>
            <DataTableHeaderCell>Priority</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={4}>No CRM follow-ups found.</DataTableEmptyRow>
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(row.scheduled_at)}</div>
                </DataTableCell>
                <DataTableCell>{row.company?.name ?? "Unknown company"}</DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.priority)}>{labelize(row.priority)}</StatusBadge>
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.status)}>{labelize(row.status)}</StatusBadge>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTableTable>
    </DataTable>
  );
}

export function DocumentTable({ rows }: { rows: CrmDocument[] }) {
  return (
    <DataTable>
      <DataTableTable>
        <DataTableHead>
          <tr>
            <DataTableHeaderCell>Document</DataTableHeaderCell>
            <DataTableHeaderCell>Company</DataTableHeaderCell>
            <DataTableHeaderCell>Created</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={4}>No CRM documents found.</DataTableEmptyRow>
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-muted-foreground">{row.file_name ?? row.document_type}</div>
                </DataTableCell>
                <DataTableCell>{row.company?.name ?? "Unknown company"}</DataTableCell>
                <DataTableCell>{formatDate(row.created_at)}</DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.status)}>{labelize(row.status)}</StatusBadge>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTableTable>
    </DataTable>
  );
}

export function HelpRequestTable({ rows }: { rows: CrmHelpRequest[] }) {
  return (
    <DataTable>
      <DataTableTable>
        <DataTableHead>
          <tr>
            <DataTableHeaderCell>Request</DataTableHeaderCell>
            <DataTableHeaderCell>Company</DataTableHeaderCell>
            <DataTableHeaderCell>Priority</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={4}>No CRM help requests found.</DataTableEmptyRow>
          ) : (
            rows.map((row) => (
              <DataTableRow key={row.id}>
                <DataTableCell>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-muted-foreground">{personLabel(row.requester)}</div>
                </DataTableCell>
                <DataTableCell>{row.company?.name ?? "Unknown company"}</DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.priority)}>{labelize(row.priority)}</StatusBadge>
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge tone={crmStatusTone(row.status)}>{labelize(row.status)}</StatusBadge>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTableTable>
    </DataTable>
  );
}
