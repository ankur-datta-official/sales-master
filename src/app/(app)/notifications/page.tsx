import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { canViewWorkspaceNotifications } from "@/lib/users/actor-permissions";
import { buildCeoDashboardHref, parseCeoDashboardSearchParams } from "@/modules/dashboard/ceo-filters";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/modules/workspace-communications/actions";
import { getWorkspaceNotificationList, getWorkspaceNotificationUnreadCount } from "@/modules/workspace-communications/service";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotificationsPage({ searchParams }: PageProps) {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewWorkspaceNotifications(role)) {
    redirect(ROUTES.dashboard);
  }

  const rawSearchParams = await searchParams;
  const unreadOnly = String(rawSearchParams.view ?? "") === "unread";
  const ceoFilters = role === "admin" ? parseCeoDashboardSearchParams(rawSearchParams) : null;
  const actor = {
    userId: profile?.id ?? user.id,
    organizationId: profile?.organization_id ?? null,
    role,
    displayName: getUserDisplayName(profile, user),
  };
  let notifications = [] as Awaited<ReturnType<typeof getWorkspaceNotificationList>>;
  let unreadCount = 0;
  try {
    const service = createServiceRoleClient();
    [notifications, unreadCount] = await Promise.all([
      getWorkspaceNotificationList({
        service,
        actor,
        unreadOnly,
      }),
      getWorkspaceNotificationUnreadCount({
        service,
        actor,
      }),
    ]);
  } catch {
    notifications = [];
    unreadCount = 0;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description="Unread-aware operational alerts and workflow reminders for your current role scope."
        actions={
          <>
            <Link
              href={unreadOnly ? ROUTES.notifications : `${ROUTES.notifications}?view=unread`}
              className={buttonVariants({ variant: unreadOnly ? "default" : "outline", size: "sm" })}
            >
              {unreadOnly ? "Showing Unread" : "Unread Only"}
            </Link>
            <form action={markAllNotificationsReadAction}>
              <input type="hidden" name="mode" value={unreadOnly ? "unread" : "all"} />
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Mark Visible Read
              </button>
            </form>
            <Link
              href={ceoFilters ? buildCeoDashboardHref(ROUTES.dashboard, ceoFilters) : ROUTES.dashboard}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Back to dashboard
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="grid-cols-[1fr_auto]">
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Latest workflow alerts, approvals, and message notifications.</CardDescription>
            </div>
            <StatusBadge tone={unreadCount > 0 ? "warning" : "neutral"}>
              {unreadCount} unread
            </StatusBadge>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No notifications for the current scope.
              </p>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="rounded-2xl border bg-background/45 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{notification.title}</p>
                        <StatusBadge tone={notification.tone} size="sm">
                          {notification.kind === "message" ? "Message" : "Workflow"}
                        </StatusBadge>
                        {!notification.isRead ? (
                          <StatusBadge tone="info" size="sm">
                            Unread
                          </StatusBadge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{notification.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge tone={notification.isRead ? "neutral" : "warning"}>
                        {notification.time}
                      </StatusBadge>
                      {!notification.isRead ? (
                        <form action={markNotificationReadAction}>
                          <input type="hidden" name="notificationId" value={notification.id} />
                          <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                            Mark Read
                          </button>
                        </form>
                      ) : null}
                      <Link href={notification.href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Tips</CardTitle>
            <CardDescription>How to use this inbox professionally during daily operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Unread workflow alerts help you prioritize active approvals, dispatch queues, and pending collections first.</p>
            <p>Message-type notifications come from workflow conversation threads and lead back to the related business context.</p>
            <p>Use “Mark Visible Read” after reviewing the currently listed items to keep the header badge meaningful.</p>
            <p>Leadership users may see both operational alerts and oversight-level message reminders in the same inbox.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
