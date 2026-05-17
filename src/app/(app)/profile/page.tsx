import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Database,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/profile";

function initialsFromName(name: string | null | undefined) {
  if (!name) return "SM";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "SM";
  }
  const letters = name.replace(/[^a-zA-Z]/g, "").slice(0, 2);
  return letters.toUpperCase() || "SM";
}

function toTitleCase(value: string | null | undefined) {
  if (!value) return null;
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function relativeDateLabel(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffDays) >= 1) {
    return formatter.format(diffDays, "day");
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) >= 1) {
    return formatter.format(diffHours, "hour");
  }

  const diffMinutes = Math.round(diffMs / (1000 * 60));
  return formatter.format(diffMinutes, "minute");
}

function getEmptyLabel(value: string | null | undefined, fallback = "Not added yet") {
  if (!value || value.trim().length === 0) return fallback;
  return value;
}

function getProfileCompleteness(profile: UserProfile | null, email: string | null, roleLabel: string | null) {
  const checks = [
    Boolean(profile?.full_name),
    Boolean(email),
    Boolean(profile?.phone),
    Boolean(profile?.designation),
    Boolean(profile?.employee_code),
    Boolean(profile?.status),
    Boolean(profile?.joined_at),
    Boolean(roleLabel),
  ];

  const complete = checks.filter(Boolean).length;
  const total = checks.length;
  const percent = Math.round((complete / total) * 100);

  return {
    complete,
    total,
    percent,
  };
}

function getCompletenessTone(percent: number): StatusTone {
  if (percent >= 80) return "success";
  if (percent >= 50) return "info";
  if (percent >= 25) return "warning";
  return "neutral";
}

function getProfileStatusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";

  const normalized = status.toLowerCase();
  if (normalized.includes("active") || normalized.includes("approved")) return "success";
  if (normalized.includes("pending") || normalized.includes("draft")) return "warning";
  if (normalized.includes("inactive") || normalized.includes("blocked")) return "danger";
  return "info";
}

function DetailRow({
  label,
  value,
  mono = false,
  subtle = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  subtle?: boolean;
}) {
  return (
    <div className="grid gap-1.5 border-b border-border/55 py-3 last:border-b-0 last:pb-0 first:pt-0 sm:grid-cols-[minmax(0,160px)_1fr] sm:items-start sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-sm font-medium text-foreground/92",
          mono && "break-all font-mono text-xs",
          subtle && "font-normal text-muted-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default async function ProfilePage() {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const displayName = getUserDisplayName(profile, user);
  const roleLabel = toTitleCase(role ?? profile?.role) ?? "Role pending";
  const statusLabel = toTitleCase(profile?.status) ?? (profile ? "Profile loaded" : "Auth only");
  const completeness = getProfileCompleteness(profile, user.email ?? profile?.email ?? null, roleLabel);
  const completenessTone = getCompletenessTone(completeness.percent);
  const memberSince = formatDate(profile?.joined_at);
  const lastUpdated = formatDateTime(profile?.updated_at);
  const updatedRelative = relativeDateLabel(profile?.updated_at);
  const joinedRelative = relativeDateLabel(profile?.joined_at);
  const profileSource = profile ? "Profiles table" : "Auth session only";
  const workspaceLabel = profile?.is_field_user ? "Field operations" : "Operational workspace";
  const statusTone = getProfileStatusTone(profile?.status);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card/82 shadow-[var(--shadow-md)] backdrop-blur-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_42%,color-mix(in_oklch,var(--accent)_18%,transparent)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-primary/12 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-[-40%] size-80 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative p-5 md:p-6 lg:p-7">
          <PageHeader
            title="Profile"
            description="Your executive identity hub for account, workspace, and system-level profile details."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                <StatusBadge tone="neutral">{profileSource}</StatusBadge>
              </div>
            }
          />

          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[24px] border border-white/30 bg-background/58 p-4 shadow-[var(--shadow-sm)] backdrop-blur-md dark:border-white/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <Avatar className="size-20 rounded-[26px] shadow-[var(--shadow-sm)] ring-1 ring-border/70" size="lg">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="rounded-[26px] bg-primary/10 text-lg font-semibold text-primary">
                      {initialsFromName(displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Sales Master Workspace
                    </p>
                    <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                      {displayName}
                    </h2>
                    <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0" />
                      <span className="min-w-0 break-all">{user.email ?? "No email available"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge tone="info">{roleLabel}</StatusBadge>
                      {profile?.is_field_user != null ? (
                        <StatusBadge tone={profile.is_field_user ? "warning" : "neutral"}>
                          {profile.is_field_user ? "Field user" : "Office user"}
                        </StatusBadge>
                      ) : null}
                      <StatusBadge tone="neutral">{workspaceLabel}</StatusBadge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 rounded-2xl border border-border/70 bg-card/68 p-3 text-sm shadow-[var(--shadow-xs)] sm:min-w-[220px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-right font-medium">{memberSince ?? "Not added yet"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="text-right font-medium">{updatedRelative ?? "Not available"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Profile source</span>
                    <span className="text-right font-medium">{profile ? "Business profile" : "Auth profile"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <KpiCard
                  label="Profile completeness"
                  value={`${completeness.percent}%`}
                  hint={`${completeness.complete} of ${completeness.total} key fields are ready`}
                  tone={completenessTone}
                  badge={completeness.percent >= 80 ? "Strong" : "In progress"}
                  icon={<BadgeCheck />}
                  className="bg-card/74"
                />
                <KpiCard
                  label="Access role"
                  value={roleLabel}
                  hint={workspaceLabel}
                  tone="info"
                  icon={<ShieldCheck />}
                  className="bg-card/74"
                />
                <KpiCard
                  label={memberSince ? "Member since" : "Profile freshness"}
                  value={memberSince ?? (updatedRelative ? toTitleCase(updatedRelative) ?? updatedRelative : "New session")}
                  hint={memberSince ? joinedRelative ?? "Registered in workspace" : lastUpdated ?? "No profile timestamp available"}
                  tone="neutral"
                  icon={<CalendarClock />}
                  className="bg-card/74"
                />
              </div>
            </div>

            <Card className="h-fit bg-card/76 shadow-[var(--shadow-sm)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base tracking-tight">Account overview</CardTitle>
                <CardDescription>Quick executive snapshot for your current workspace identity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                      <BriefcaseBusiness className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight">Workspace alignment</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        This profile follows the same premium operational identity language used across the dashboard and core workspace surfaces.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Profile row
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {profile ? "Loaded and ready" : "Auth session fallback"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {profile
                        ? "Business profile data is available from the shared profiles table."
                        : "Only authentication identity is currently available for this account."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Last sync
                    </p>
                    <p className="mt-1 break-words font-mono text-xs text-foreground/90">
                      {lastUpdated ?? "No timestamp available"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {updatedRelative ?? "Timestamp will appear when profile data is updated."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <SectionCard
            title="Identity"
            description="Primary account identity used across the workspace."
            contentClassName="space-y-0"
          >
            <dl>
              <DetailRow label="Full name" value={getEmptyLabel(profile?.full_name, displayName)} />
              <DetailRow label="Display name" value={displayName} />
              <DetailRow label="Email" value={user.email ?? "No email available"} mono />
            </dl>
          </SectionCard>

          <SectionCard
            title="Work profile"
            description="Role, employment, and operating context for this account."
            contentClassName="space-y-0"
          >
            <dl>
              <DetailRow label="Role" value={roleLabel} mono />
              <DetailRow label="Designation" value={getEmptyLabel(profile?.designation)} />
              <DetailRow label="Employee code" value={getEmptyLabel(profile?.employee_code)} mono />
              <DetailRow
                label="Field activity"
                value={
                  profile?.is_field_user == null
                    ? "Not specified yet"
                    : profile.is_field_user
                      ? "Enabled for field operations"
                      : "Office-focused workspace access"
                }
              />
              <DetailRow label="Status" value={statusLabel} />
            </dl>
          </SectionCard>

          <SectionCard
            title="Contact"
            description="Direct contact information available in the current profile."
            contentClassName="space-y-0"
          >
            <dl>
              <DetailRow label="Phone" value={getEmptyLabel(profile?.phone)} />
            </dl>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            title="System details"
            description="Technical identity and lifecycle timestamps for this account."
            contentClassName="space-y-0"
          >
            <dl>
              <DetailRow label="User ID" value={user.id} mono />
              <DetailRow label="Profile source" value={profileSource} />
              <DetailRow label="Profile updated" value={lastUpdated ?? "Not available"} mono subtle={!lastUpdated} />
              <DetailRow label="Joined date" value={memberSince ?? "Not added yet"} mono subtle={!memberSince} />
            </dl>
          </SectionCard>

          <Card className="bg-card/76 shadow-[var(--shadow-sm)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base tracking-tight">Profile health</CardTitle>
              <CardDescription>Readiness indicators based only on currently available live data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Activity className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">Read-only executive profile</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      This hub is intentionally optimized for clarity, review, and quick workspace recognition without introducing incomplete edit flows.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Database className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">Graceful sparse-data handling</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Empty business fields stay usable with clean fallback labels, while auth-derived identity remains visible and trusted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <UserRound className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">Future-ready structure</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      The page sections are already grouped for future profile expansion, while staying grounded in today&apos;s live fields only.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
