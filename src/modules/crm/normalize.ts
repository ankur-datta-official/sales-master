import type { StatusTone } from "@/components/ui/status-badge";

export function labelize(value: string | null | undefined) {
  if (!value) return "Unassigned";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function formatMoney(value: number | null | undefined) {
  if (value == null) return "Not set";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function crmStatusTone(value: string | null | undefined): StatusTone {
  if (!value) return "neutral";
  if (["active", "completed", "resolved", "approved", "seen"].includes(value)) return "success";
  if (["pending", "open", "submitted", "in_progress"].includes(value)) return "info";
  if (["high", "urgent", "revision_requested", "rescheduled"].includes(value)) return "warning";
  if (["inactive", "archived", "cancelled", "rejected"].includes(value)) return "danger";
  return "neutral";
}

export function personLabel(person?: { full_name?: string | null; email?: string | null } | null) {
  return person?.full_name || person?.email || "Unassigned";
}
