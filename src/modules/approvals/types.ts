import type {
  ApprovalLogAction,
  DemandOrderStage,
  DemandOrderStatus,
} from "@/constants/statuses";
import type { ApprovalLogWithActors } from "@/modules/approval-logs/types";
import type { DemandOrderItemWithProduct } from "@/modules/demand-orders/types";

export const APPROVAL_WORKSPACE_QUEUES = [
  "manager_review",
  "accounts_review",
] as const;

export type ApprovalWorkspaceQueue =
  (typeof APPROVAL_WORKSPACE_QUEUES)[number];

export type ApprovalWorkspaceFilters = {
  queue: ApprovalWorkspaceQueue;
  status: DemandOrderStatus | "";
  action: ApprovalLogAction | "";
  search: string;
  selected: string;
};

export type ApprovalWorkspaceSummary = {
  managerPending: number;
  underReview: number;
  accountsQueue: number;
  recentDecisions: number;
};

export type ApprovalInboxItem = {
  entityType: "demand_order";
  id: string;
  queue: ApprovalWorkspaceQueue;
  title: string;
  partyName: string | null;
  partyCode: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerLabel: string;
  amount: number;
  stage: DemandOrderStage;
  status: DemandOrderStatus;
  remarks: string;
  submittedAt: string | null;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  latestAction: ApprovalLogAction | null;
  latestActionAt: string | null;
  latestActionNote: string;
  latestActorLabel: string | null;
  isActionable: boolean;
};

export type ApprovalWorkspaceDetail = {
  item: ApprovalInboxItem;
  timeline: ApprovalLogWithActors[];
  lineItems: DemandOrderItemWithProduct[];
  forwardTargets: { id: string; full_name: string | null; email: string | null }[];
};

export type ApprovalWorkspaceData = {
  defaultQueue: ApprovalWorkspaceQueue;
  filters: ApprovalWorkspaceFilters;
  summary: ApprovalWorkspaceSummary;
  tabs: {
    key: ApprovalWorkspaceQueue;
    label: string;
    description: string;
    count: number;
  }[];
  availableStatuses: DemandOrderStatus[];
  availableActions: ApprovalLogAction[];
  items: ApprovalInboxItem[];
  selected: ApprovalWorkspaceDetail | null;
};
