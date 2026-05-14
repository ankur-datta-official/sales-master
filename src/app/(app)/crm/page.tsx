import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  FileStack,
  Handshake,
  KanbanSquare,
  MoveRight,
} from "lucide-react";

import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatDateTime,
  formatMoney,
  labelize,
  personLabel,
} from "@/modules/crm/normalize";
import { getCrmWorkspaceSummary } from "@/modules/crm/queries";
import { CRM_WORKSPACE_SECTIONS } from "@/modules/crm/workspace";

function sectionMetric(
  key: string,
  summary: Awaited<ReturnType<typeof getCrmWorkspaceSummary>>
) {
  switch (key) {
    case "companies":
      return `${summary.totals.companies} accounts`;
    case "contacts":
      return `${summary.totals.contacts} contacts`;
    case "meetings":
      return `${summary.totals.meetings} meetings`;
    case "followups":
      return `${summary.pendingFollowups} pending now`;
    case "pipeline":
      return formatMoney(summary.pipelineValue);
    case "documents":
      return `${summary.totals.documents} documents`;
    case "help":
      return `${summary.openHelpRequests.length} active requests`;
    case "reports":
      return `${summary.stageSummary.length} active stages`;
    default:
      return "";
  }
}

export default async function CrmIndexPage() {
  const summary = await getCrmWorkspaceSummary();
  const sections = CRM_WORKSPACE_SECTIONS.filter((section) => section.key !== "overview");
  const topStages = summary.stageSummary
    .filter((stage) => stage.companyCount > 0)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Companies"
          value={summary.totals.companies}
          hint="Active CRM accounts and prospects"
          icon={<FileStack />}
          tone="info"
        />
        <KpiCard
          label="Contacts"
          value={summary.totals.contacts}
          hint="Mapped decision makers and stakeholders"
          icon={<Handshake />}
          tone="success"
        />
        <KpiCard
          label="Pending follow-ups"
          value={summary.pendingFollowups}
          hint={`${summary.urgentFollowups.length} urgent items need attention`}
          icon={<CircleAlert />}
          tone={summary.urgentFollowups.length > 0 ? "warning" : "neutral"}
        />
        <KpiCard
          label="Pipeline value"
          value={formatMoney(summary.pipelineValue)}
          hint={`${summary.totals.meetings} meetings logged across CRM`}
          icon={<KanbanSquare />}
          tone="info"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <SectionCard
          title="Continue workflow"
          description="Jump into the areas most likely to need immediate action."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border bg-background/72 p-4 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <Handshake className="size-4 text-primary" />
                Urgent follow-ups
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {summary.urgentFollowups.length}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                High-priority follow-ups still waiting to be completed.
              </p>
              <Link
                href="/crm/followups"
                className={cn(
                  buttonVariants({ variant: "soft", size: "sm" }),
                  "mt-4 rounded-xl"
                )}
              >
                Open follow-ups
              </Link>
            </div>

            <div className="rounded-[22px] border bg-background/72 p-4 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <CircleAlert className="size-4 text-primary" />
                Help queue
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {summary.openHelpRequests.length}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Open or in-progress support needs inside the CRM flow.
              </p>
              <Link
                href="/crm/help"
                className={cn(
                  buttonVariants({ variant: "soft", size: "sm" }),
                  "mt-4 rounded-xl"
                )}
              >
                Review help
              </Link>
            </div>

            <div className="rounded-[22px] border bg-background/72 p-4 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <CalendarClock className="size-4 text-primary" />
                Logged meetings
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {summary.totals.meetings}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Keep meeting history, timing, and follow-through visible.
              </p>
              <Link
                href="/crm/meetings"
                className={cn(
                  buttonVariants({ variant: "soft", size: "sm" }),
                  "mt-4 rounded-xl"
                )}
              >
                View meetings
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Pipeline pulse"
          description="See which stages currently hold the most momentum."
        >
          <div className="space-y-3">
            {topStages.length === 0 ? (
              <div className="rounded-[22px] border border-dashed bg-background/65 px-4 py-5 text-sm text-muted-foreground">
                No active stage data yet. Add companies and assign pipeline stages to
                populate the module overview.
              </div>
            ) : (
              topStages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-[22px] border bg-background/72 px-4 py-3 shadow-[var(--shadow-xs)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stage.companyCount} companies at {stage.probability}% probability
                      </p>
                    </div>
                    <div className="text-right text-sm font-semibold tracking-tight">
                      {formatMoney(stage.totalValue)}
                    </div>
                  </div>
                </div>
              ))
            )}

            <Link
              href="/crm/pipeline"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
            >
              Open pipeline
              <MoveRight />
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="What needs attention"
          description="A quick list of upcoming CRM actions without opening every page."
        >
          <div className="space-y-3">
            {summary.urgentFollowups.slice(0, 3).map((followup) => (
              <div
                key={followup.id}
                className="rounded-[22px] border bg-background/72 px-4 py-3 shadow-[var(--shadow-xs)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium tracking-tight">{followup.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {followup.company?.name ?? "Unknown company"} •{" "}
                      {formatDateTime(followup.scheduled_at)}
                    </p>
                  </div>
                  <span className="rounded-full border bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    {labelize(followup.priority)}
                  </span>
                </div>
              </div>
            ))}
            {summary.urgentFollowups.length === 0 ? (
              <div className="rounded-[22px] border border-dashed bg-background/65 px-4 py-5 text-sm text-muted-foreground">
                No urgent follow-ups are pending right now.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent meetings"
          description="Latest conversation records across the workspace."
        >
          <div className="space-y-3">
            {summary.recentMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-[22px] border bg-background/72 px-4 py-3 shadow-[var(--shadow-xs)]"
              >
                <p className="font-medium tracking-tight">{meeting.interaction_type}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {meeting.company?.name ?? "Unknown company"} •{" "}
                  {personLabel(meeting.assignee)} • {formatDateTime(meeting.meeting_at)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="CRM module map"
        description="Enter any CRM capability from one consistent premium workspace."
      >
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {sections.map((section) => (
            <div
              key={section.key}
              className="group relative overflow-hidden rounded-[24px] border bg-card/90 p-4 shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-90",
                  section.accentClassName
                )}
              />
              <div className="relative flex h-full flex-col">
                <div className="flex size-11 items-center justify-center rounded-2xl border bg-background/80 shadow-[var(--shadow-xs)]">
                  <section.icon className="size-5 text-primary" />
                </div>
                <div className="mt-4">
                  <p className="text-base font-semibold tracking-tight">{section.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border bg-background/72 px-3 py-2 text-sm font-medium tracking-tight shadow-[var(--shadow-xs)]">
                  {sectionMetric(section.key, summary)}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={section.href}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-xl"
                    )}
                  >
                    Open
                    <ArrowRight />
                  </Link>
                  {section.createHref && section.createLabel ? (
                    <Link
                      href={section.createHref}
                      className={cn(
                        buttonVariants({ variant: "soft", size: "sm" }),
                        "rounded-xl"
                      )}
                    >
                      {section.createLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
