import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CircleHelp,
  FileText,
  Handshake,
  KanbanSquare,
  LayoutGrid,
  Users,
} from "lucide-react";

import { ROUTES } from "@/config/routes";

export type CrmWorkspaceSectionKey =
  | "overview"
  | "companies"
  | "contacts"
  | "meetings"
  | "followups"
  | "pipeline"
  | "documents"
  | "help"
  | "reports";

export type CrmWorkspaceSection = {
  key: CrmWorkspaceSectionKey;
  title: string;
  shortLabel: string;
  href: string;
  description: string;
  icon: LucideIcon;
  accentClassName: string;
  createHref?: string;
  createLabel?: string;
};

export const CRM_WORKSPACE_SECTIONS: readonly CrmWorkspaceSection[] = [
  {
    key: "overview",
    title: "Overview",
    shortLabel: "Overview",
    href: ROUTES.crm,
    description: "Monitor the full CRM operation from one guided workspace.",
    icon: LayoutGrid,
    accentClassName: "from-primary/16 via-primary/8 to-transparent",
  },
  {
    key: "companies",
    title: "Companies",
    shortLabel: "Companies",
    href: ROUTES.crmCompanies,
    description: "Track buyers, prospects, and account value in one place.",
    icon: Building2,
    accentClassName: "from-sky-500/18 via-primary/8 to-transparent",
    createHref: ROUTES.crmCompaniesNew,
    createLabel: "New company",
  },
  {
    key: "contacts",
    title: "Contacts",
    shortLabel: "Contacts",
    href: ROUTES.crmContacts,
    description: "Keep decision makers, influencers, and owners mapped cleanly.",
    icon: Users,
    accentClassName: "from-emerald-500/18 via-primary/8 to-transparent",
    createHref: ROUTES.crmContactsNew,
    createLabel: "New contact",
  },
  {
    key: "meetings",
    title: "Meetings",
    shortLabel: "Meetings",
    href: ROUTES.crmMeetings,
    description: "Capture discussion history, meeting timing, and next steps.",
    icon: CalendarClock,
    accentClassName: "from-amber-500/18 via-primary/8 to-transparent",
    createHref: ROUTES.crmMeetingsNew,
    createLabel: "Log meeting",
  },
  {
    key: "followups",
    title: "Follow-ups",
    shortLabel: "Follow-ups",
    href: ROUTES.crmFollowups,
    description: "Stay ahead of pending actions, reminders, and commitments.",
    icon: Handshake,
    accentClassName: "from-fuchsia-500/18 via-primary/8 to-transparent",
    createHref: ROUTES.crmFollowupsNew,
    createLabel: "New follow-up",
  },
  {
    key: "pipeline",
    title: "Pipeline",
    shortLabel: "Pipeline",
    href: ROUTES.crmPipeline,
    description: "Read stage movement, probability, and opportunity concentration.",
    icon: KanbanSquare,
    accentClassName: "from-violet-500/18 via-primary/8 to-transparent",
  },
  {
    key: "documents",
    title: "Documents",
    shortLabel: "Documents",
    href: ROUTES.crmDocuments,
    description: "Organize quotations, proposals, and relationship assets.",
    icon: FileText,
    accentClassName: "from-cyan-500/18 via-primary/8 to-transparent",
    createHref: ROUTES.crmDocumentsNew,
    createLabel: "Add document",
  },
  {
    key: "help",
    title: "Help",
    shortLabel: "Help",
    href: ROUTES.crmHelp,
    description: "Escalate support needs before momentum is lost.",
    icon: CircleHelp,
    accentClassName: "from-rose-500/18 via-primary/8 to-transparent",
    createHref: ROUTES.crmHelpNew,
    createLabel: "Request help",
  },
  {
    key: "reports",
    title: "Reports",
    shortLabel: "Reports",
    href: ROUTES.crmReports,
    description: "See the module health, pipeline value, and operating snapshot.",
    icon: BarChart3,
    accentClassName: "from-indigo-500/18 via-primary/8 to-transparent",
  },
] as const;

export const CRM_QUICK_ACTIONS = CRM_WORKSPACE_SECTIONS.filter(
  (section) => section.createHref && section.createLabel
).map((section) => ({
  key: section.key,
  href: section.createHref!,
  label: section.createLabel!,
}));

export function getCrmSectionFromSegment(
  segment: string | null
): CrmWorkspaceSection {
  if (!segment) {
    return CRM_WORKSPACE_SECTIONS[0];
  }

  return (
    CRM_WORKSPACE_SECTIONS.find((section) => section.key === segment) ??
    CRM_WORKSPACE_SECTIONS[0]
  );
}
