"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BellRing,
  MessageSquareMore,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  WorkspaceMessagePreviewData,
  WorkspaceMessagePreviewItem,
  WorkspaceNotificationPreviewData,
  WorkspaceNotificationPreviewItem,
} from "@/modules/workspace-communications/service";
import { cn } from "@/lib/utils";

type NotificationLike = WorkspaceNotificationPreviewItem;
type MessageLike = WorkspaceMessagePreviewItem;

type TopbarInboxMenuProps = {
  title: string;
  endpoint: string;
  href: string;
  ariaLabel: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDetail: string;
  kind: "notifications" | "messages";
};

function compactCount(value: number) {
  if (value <= 0) return "";
  if (value > 9) return "9+";
  return String(value);
}

function getItemSurfaceClass(tone: NotificationLike["tone"]) {
  if (tone === "danger") {
    return "border-[oklch(from_var(--status-danger)_l_c_h/0.12)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_98%,white)_0%,color-mix(in_oklch,var(--background)_95%,var(--muted))_100%)]";
  }
  if (tone === "warning") {
    return "border-[oklch(from_var(--status-warning)_l_c_h/0.14)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_98%,white)_0%,color-mix(in_oklch,var(--background)_95%,var(--muted))_100%)]";
  }
  return "border-border/75 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_98%,white)_0%,color-mix(in_oklch,var(--background)_95%,var(--muted))_100%)]";
}

function getItemIconClass(tone: NotificationLike["tone"]) {
  if (tone === "danger") {
    return "bg-[oklch(from_var(--status-danger)_l_c_h/0.08)] text-[oklch(from_var(--status-danger)_l_c_h)] ring-[oklch(from_var(--status-danger)_l_c_h/0.12)]";
  }
  if (tone === "warning") {
    return "bg-[oklch(from_var(--status-warning)_l_c_h/0.08)] text-[oklch(from_var(--status-warning)_l_c_h)] ring-[oklch(from_var(--status-warning)_l_c_h/0.14)]";
  }
  return "bg-primary/8 text-primary ring-primary/10";
}

export function TopbarInboxMenu(props: TopbarInboxMenuProps) {
  const [open, setOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsData, setNotificationsData] = useState<WorkspaceNotificationPreviewData | null>(null);
  const [messagesData, setMessagesData] = useState<WorkspaceMessagePreviewData | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    fetch(props.endpoint, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load inbox preview.");
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (props.kind === "notifications") {
          setNotificationsData(data as WorkspaceNotificationPreviewData);
        } else {
          setMessagesData(data as WorkspaceMessagePreviewData);
        }
        setHasFetched(true);
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Could not load inbox preview.");
          setHasFetched(true);
        }
      })

    return () => {
      cancelled = true;
    };
  }, [open, props.endpoint, props.kind]);

  const unreadCount = useMemo(() => {
    if (props.kind === "notifications") return notificationsData?.unreadCount ?? 0;
    return messagesData?.unreadCount ?? 0;
  }, [messagesData, notificationsData, props.kind]);

  const items = useMemo<Array<NotificationLike | MessageLike>>(() => {
    if (props.kind === "notifications") return notificationsData?.items ?? [];
    return messagesData?.items ?? [];
  }, [messagesData, notificationsData, props.kind]);
  const loading = open && !hasFetched && !error;

  const Icon = props.icon;
  const isNotifications = props.kind === "notifications";

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) return;
        setHasFetched(false);
        setError(null);
        if (props.kind === "notifications") {
          setNotificationsData(null);
        } else {
          setMessagesData(null);
        }
      }}
    >
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-lg" }),
            "relative size-10 rounded-[1rem] border border-border/75 bg-background/92 text-muted-foreground shadow-[0_4px_12px_color-mix(in_oklch,var(--border)_7%,transparent)] hover:border-primary/16 hover:bg-white hover:text-foreground"
          )}
          aria-label={props.ariaLabel}
        >
        <Icon className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none text-destructive-foreground ring-2 ring-background">
            {compactCount(unreadCount)}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-[410px] min-w-[410px] rounded-[26px] border border-border/75 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--popover)_97%,white)_0%,color-mix(in_oklch,var(--popover)_93%,var(--background))_100%)] p-2.5 shadow-[0_24px_64px_hsl(220_20%_16%_/_0.14)] ring-1 ring-white/70 backdrop-blur-xl"
      >
        <div className="overflow-hidden rounded-[22px] border border-border/65 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_97%,white)_0%,color-mix(in_oklch,var(--background)_94%,var(--muted))_100%)] shadow-[0_10px_28px_color-mix(in_oklch,var(--border)_8%,transparent)]">
          <div
            aria-hidden="true"
            className={cn(
              "h-1 w-full",
              isNotifications
                ? "bg-[linear-gradient(90deg,color-mix(in_oklch,var(--primary)_24%,transparent),color-mix(in_oklch,var(--primary)_58%,white),color-mix(in_oklch,var(--primary)_18%,transparent))]"
                : "bg-[linear-gradient(90deg,color-mix(in_oklch,var(--primary)_24%,transparent),color-mix(in_oklch,var(--primary)_58%,white),color-mix(in_oklch,var(--primary)_18%,transparent))]"
            )}
          />
          <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-3.5">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-[1rem] ring-1 ring-inset shadow-[0_8px_18px_color-mix(in_oklch,var(--border)_7%,transparent)]",
                  isNotifications
                    ? "bg-primary/8 text-primary ring-primary/12"
                    : "bg-primary/8 text-primary ring-primary/12"
                )}
              >
                {isNotifications ? <BellRing className="size-4" /> : <MessageSquareMore className="size-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[0.95rem] font-semibold tracking-tight text-foreground">
                    {props.title}
                  </div>
                  <span className="rounded-full border border-border/60 bg-background/88 px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Live feed
                  </span>
                </div>
                <p className="mt-1 max-w-[240px] text-[0.78rem] leading-5 text-muted-foreground">
                  {isNotifications
                    ? "Recent workflow alerts and operational reminders."
                    : "Latest thread activity across your workspace flows."}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {unreadCount > 0 ? (
                <StatusBadge
                  tone="warning"
                  size="sm"
                  className="rounded-full px-2.5 py-0.5 font-semibold"
                >
                  {unreadCount} unread
                </StatusBadge>
              ) : (
                <StatusBadge
                  tone="neutral"
                  size="sm"
                  className="rounded-full px-2.5 py-0.5 font-semibold"
                >
                  All caught up
                </StatusBadge>
              )}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="my-2.5" />
        <div className="flex items-center justify-between px-1.5 pb-1">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Recent activity
          </p>
          <p className="text-[0.68rem] font-medium text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="crm-sidebar-scroll max-h-[min(68vh,31rem)] space-y-2.5 overflow-y-auto px-1.5 pb-1 pr-1">
          {loading ? (
            <div className="overflow-hidden rounded-[20px] border border-dashed border-border/70 bg-background/88 px-4 py-8 text-sm text-muted-foreground shadow-[var(--shadow-xs)]">
              <div className="mb-3 h-2 w-28 rounded-full bg-muted/80" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-muted/70" />
                <div className="h-3 w-4/5 rounded-full bg-muted/55" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[20px] border border-dashed border-destructive/25 bg-destructive/5 px-4 py-8 text-sm text-destructive shadow-[var(--shadow-xs)]">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-border/70 bg-background/88 px-4 py-8 shadow-[var(--shadow-xs)]">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-[0.95rem] bg-muted/65 text-muted-foreground shadow-[var(--shadow-xs)]">
                <Sparkles className="size-4" />
              </div>
              <p className="text-sm font-medium">{props.emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{props.emptyDetail}</p>
            </div>
          ) : (
            items.map((item) =>
              props.kind === "notifications" ? (
                <Link
                  key={item.id}
                  href={(item as NotificationLike).href}
                  className={cn(
                    "group block rounded-[20px] border px-4 py-4 shadow-[0_8px_22px_color-mix(in_oklch,var(--border)_6%,transparent)] transition-[border-color,box-shadow,background-color] duration-200",
                    "hover:border-primary/14 hover:shadow-[0_12px_28px_color-mix(in_oklch,var(--primary)_8%,transparent)]",
                    getItemSurfaceClass((item as NotificationLike).tone)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[0.95rem] ring-1 ring-inset",
                        getItemIconClass((item as NotificationLike).tone)
                      )}
                    >
                      <BellRing className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[0.92rem] font-semibold tracking-tight text-foreground">
                              {(item as NotificationLike).title}
                            </p>
                            {(item as NotificationLike).isRead ? null : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary/7 px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-primary">
                                New
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-5 text-muted-foreground">
                            {(item as NotificationLike).detail}
                          </p>
                        </div>
                        <StatusBadge
                          tone={(item as NotificationLike).tone}
                          size="sm"
                          className="shrink-0 rounded-full px-2 py-0.5 font-medium"
                        >
                          {(item as NotificationLike).time}
                        </StatusBadge>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/45 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-2 rounded-full bg-primary/80" />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Workflow update
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                          Open
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  key={item.id}
                  href={(item as MessageLike).href}
                  className="group block rounded-[20px] border border-border/75 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_98%,white)_0%,color-mix(in_oklch,var(--background)_95%,var(--muted))_100%)] px-4 py-4 shadow-[0_8px_22px_color-mix(in_oklch,var(--border)_6%,transparent)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/14 hover:shadow-[0_12px_28px_color-mix(in_oklch,var(--primary)_8%,transparent)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[0.95rem] bg-primary/8 text-primary ring-1 ring-primary/10">
                      <MessageSquareMore className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[0.92rem] font-semibold tracking-tight text-foreground">
                              {(item as MessageLike).subject}
                            </p>
                            {(item as MessageLike).unreadCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary/7 px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-primary">
                                {compactCount((item as MessageLike).unreadCount)} new
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {(item as MessageLike).entityLabel}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[0.8rem] leading-5 text-muted-foreground">
                            {(item as MessageLike).snippet}
                          </p>
                        </div>
                        <StatusBadge
                          tone={(item as MessageLike).unreadCount > 0 ? "info" : "neutral"}
                          size="sm"
                          className="shrink-0 rounded-full px-2 py-0.5 font-medium"
                        >
                          {(item as MessageLike).time}
                        </StatusBadge>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/45 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-2 rounded-full bg-primary/80" />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Conversation thread
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                          Open
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            )
          )}
        </div>
        <DropdownMenuSeparator className="my-2.5" />
        <div className="rounded-[20px] border border-border/65 bg-background/86 p-1.5 shadow-[var(--shadow-xs)]">
          <Link
            href={props.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-11 w-full justify-center rounded-[16px] border-border/70 bg-white/78 font-semibold shadow-[var(--shadow-xs)] hover:bg-white"
            )}
          >
            View All
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
