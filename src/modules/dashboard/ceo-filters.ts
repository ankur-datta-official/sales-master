import { z } from "zod";

export const CEO_DASHBOARD_VIEW_VALUES = [
  "executive_overview",
  "divisions",
  "zones",
  "marketers",
] as const;

export const ceoDashboardViewSchema = z.enum(CEO_DASHBOARD_VIEW_VALUES);

export type CeoDashboardView = z.infer<typeof ceoDashboardViewSchema>;

export type CeoDashboardFilters = {
  division: string;
  zone: string;
  dateFrom: string;
  dateTo: string;
  view: CeoDashboardView;
};

export type DashboardFilterOption = {
  value: string;
  label: string;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): string {
  return dateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

function isDateLike(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDateRange(dateFrom: string, dateTo: string, fallbackFrom: string, fallbackTo: string) {
  const safeFrom = isDateLike(dateFrom) ? dateFrom : fallbackFrom;
  const safeTo = isDateLike(dateTo) ? dateTo : fallbackTo;

  if (safeFrom <= safeTo) {
    return { dateFrom: safeFrom, dateTo: safeTo };
  }

  return { dateFrom: safeTo, dateTo: safeFrom };
}

export function getCeoDashboardDefaultFilters(now = new Date()): CeoDashboardFilters {
  return {
    division: "",
    zone: "",
    dateFrom: startOfMonth(now),
    dateTo: dateOnly(now),
    view: "executive_overview",
  };
}

export function parseCeoDashboardSearchParams(
  raw: RawSearchParams,
  now = new Date()
): CeoDashboardFilters {
  const defaults = getCeoDashboardDefaultFilters(now);
  const rawDateFrom = firstValue(raw.date_from) || firstValue(raw.dateFrom);
  const rawDateTo = firstValue(raw.date_to) || firstValue(raw.dateTo);
  const dateRange = normalizeDateRange(rawDateFrom, rawDateTo, defaults.dateFrom, defaults.dateTo);
  const viewResult = ceoDashboardViewSchema.safeParse(firstValue(raw.view));

  return {
    division: firstValue(raw.division).trim(),
    zone: firstValue(raw.zone).trim(),
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    view: viewResult.success ? viewResult.data : defaults.view,
  };
}

export function getCeoDashboardViewLabel(view: CeoDashboardView): string {
  switch (view) {
    case "divisions":
      return "Divisions";
    case "zones":
      return "Zones";
    case "marketers":
      return "Marketers";
    default:
      return "Executive Overview";
  }
}

export const CEO_DASHBOARD_VIEW_OPTIONS: DashboardFilterOption[] = [
  { value: "executive_overview", label: "Executive Overview" },
  { value: "divisions", label: "Divisions" },
  { value: "zones", label: "Zones" },
  { value: "marketers", label: "Marketers" },
];

export function buildCeoDashboardHref(
  pathname: string,
  filters: CeoDashboardFilters,
  overrides: Partial<CeoDashboardFilters> = {}
): string {
  const nextFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (nextFilters.division) params.set("division", nextFilters.division);
  if (nextFilters.zone) params.set("zone", nextFilters.zone);
  if (nextFilters.view) params.set("view", nextFilters.view);
  if (nextFilters.dateFrom) params.set("dateFrom", nextFilters.dateFrom);
  if (nextFilters.dateTo) params.set("dateTo", nextFilters.dateTo);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

