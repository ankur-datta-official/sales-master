import type { StatusTone } from "@/components/ui/status-badge";
import type { AppRole } from "@/constants/roles";
import type { RoleDashboardVariant } from "@/lib/auth/role-presentation";
import type {
  CeoDashboardView,
  DashboardFilterOption,
} from "@/modules/dashboard/ceo-filters";

export type DashboardIconKey =
  | "activity"
  | "alert"
  | "analytics"
  | "approval"
  | "banknote"
  | "bell"
  | "calendar"
  | "check"
  | "customer"
  | "delivery"
  | "document"
  | "package"
  | "target"
  | "team"
  | "trend"
  | "wallet";

export type DashboardKpi = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  detail?: string;
  tone?: StatusTone;
  icon: DashboardIconKey;
  percent?: number | null;
  href?: string;
};

export type DashboardAction = {
  key: string;
  label: string;
  hint: string;
  href: string;
  icon: DashboardIconKey;
  tone?: StatusTone;
};

export type DashboardProgressMetric = {
  key: string;
  label: string;
  actual: string;
  target: string;
  percent: number;
  tone?: StatusTone;
};

export type DashboardTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type DashboardTableCell = {
  key: string;
  value: string;
  tone?: StatusTone;
  mono?: boolean;
};

export type DashboardTableRow = {
  key: string;
  href?: string;
  cells: DashboardTableCell[];
};

export type DashboardTableSection = {
  key: string;
  title: string;
  description?: string;
  columns: DashboardTableColumn[];
  rows: DashboardTableRow[];
  emptyLabel: string;
  actionLabel?: string;
  actionHref?: string;
};

export type DashboardAlert = {
  key: string;
  title: string;
  detail?: string;
  time?: string;
  tone?: StatusTone;
};

export type DashboardMiniStat = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  tone?: StatusTone;
  icon: DashboardIconKey;
};

export type DashboardTrendPoint = {
  label: string;
  sales: number;
  collections: number;
};

export type DashboardFilters = {
  show: boolean;
  dateLabel: string;
  scopeLabel: string;
  viewTabs: string[];
  activeView: string;
  activeViewKey?: CeoDashboardView | string;
  divisionValue?: string;
  zoneValue?: string;
  dateFrom?: string;
  dateTo?: string;
  divisionOptions?: DashboardFilterOption[];
  zoneOptions?: DashboardFilterOption[];
  viewOptions?: DashboardFilterOption[];
};

export type RoleDashboardData = {
  role: AppRole | null;
  variant: RoleDashboardVariant;
  title: string;
  subtitle: string;
  greeting: string;
  userName: string;
  dateLabel: string;
  primaryCtaHref: string;
  filters: DashboardFilters;
  warnings: string[];
  kpis: DashboardKpi[];
  actions: DashboardAction[];
  progress: DashboardProgressMetric[];
  miniStats: DashboardMiniStat[];
  trend: DashboardTrendPoint[];
  sections: DashboardTableSection[];
  alerts: DashboardAlert[];
};
