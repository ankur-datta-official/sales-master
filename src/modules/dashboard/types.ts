import type { AppRole } from "@/constants/roles";

export type DashboardSummaryCard = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

export type DashboardQuickWidget = {
  key: string;
  label: string;
  href: string;
  value?: string;
  hint?: string;
};

export type DashboardRecentWorkReport = {
  id: string;
  report_date: string;
  summary: string;
  status: string;
  owner_name: string | null;
};

export type DashboardRecentOrder = {
  id: string;
  order_date: string;
  status: string;
  stage: string;
  total_amount: number;
  owner_name: string | null;
  party_name: string | null;
};

export type DashboardRecentActivity = {
  id: string;
  at: string;
  action: string;
  actor_name: string | null;
  note: string;
};

export type DashboardData = {
  role: AppRole | null;
  summary_cards: DashboardSummaryCard[];
  quick_widgets: DashboardQuickWidget[];
  recent_work_reports: DashboardRecentWorkReport[];
  recent_orders: DashboardRecentOrder[];
  recent_activity: DashboardRecentActivity[];
};
