import type { AppRole } from "@/constants/roles";

export type AnalyticsScope = "own" | "team";

export type AnalyticsPoint = {
  date: string;
  value: number;
};

export type AnalyticsSummaryCard = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

export type AnalyticsWidget = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

export type SalesTrendSection = {
  total_amount: number;
  points: AnalyticsPoint[];
};

export type CollectionTrendSection = {
  total_amount: number;
  points: AnalyticsPoint[];
};

export type TargetVsActualSection = {
  sales_target: number;
  sales_actual: number;
  collection_target: number;
  collection_actual: number;
};

export type AttendanceSummarySection = {
  active_now: number;
  checked_in_today: number;
  checked_out_today: number;
  missed_checkout: number;
};

export type OrderPipelineSummarySection = {
  draft: number;
  manager_review: number;
  accounts_review: number;
  factory_queue: number;
  rejected: number;
  sent_to_factory: number;
};

export type AnalyticsData = {
  role: AppRole | null;
  summary_cards: AnalyticsSummaryCard[];
  quick_widgets: AnalyticsWidget[];
  sales_trend: SalesTrendSection | null;
  collection_trend: CollectionTrendSection | null;
  target_vs_actual: TargetVsActualSection | null;
  attendance_summary: AttendanceSummarySection | null;
  order_pipeline_summary: OrderPipelineSummarySection | null;
};
