"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

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

export function TopbarInboxMenu(props: TopbarInboxMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsData, setNotificationsData] = useState<WorkspaceNotificationPreviewData | null>(null);
  const [messagesData, setMessagesData] = useState<WorkspaceMessagePreviewData | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

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
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Could not load inbox preview.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

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

  const Icon = props.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-lg" }),
          "relative size-9 rounded-xl border border-border/75 bg-card/78 text-muted-foreground shadow-none hover:border-primary/20 hover:bg-card hover:text-foreground"
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
        className="w-[360px] min-w-[360px] rounded-[22px] border-border/80 bg-popover/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3 px-2.5 pb-1 pt-1.5">
          <div className="text-sm font-semibold text-foreground">
            {props.title}
          </div>
          <StatusBadge tone={unreadCount > 0 ? "info" : "neutral"} size="sm">
            {unreadCount} unread
          </StatusBadge>
        </div>
        <DropdownMenuSeparator />
        <div className="space-y-2 p-1">
          {loading ? (
            <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              Loading latest items...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-destructive/25 px-4 py-6 text-sm text-destructive">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-6">
              <p className="text-sm font-medium">{props.emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{props.emptyDetail}</p>
            </div>
          ) : (
            items.map((item) =>
              props.kind === "notifications" ? (
                <Link
                  key={item.id}
                  href={(item as NotificationLike).href}
                  className="block rounded-2xl border bg-background/45 px-3 py-3 transition-colors hover:bg-background/75"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{(item as NotificationLike).title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{(item as NotificationLike).detail}</p>
                    </div>
                    <StatusBadge tone={(item as NotificationLike).tone} size="sm">
                      {(item as NotificationLike).time}
                    </StatusBadge>
                  </div>
                </Link>
              ) : (
                <Link
                  key={item.id}
                  href={(item as MessageLike).href}
                  className="block rounded-2xl border bg-background/45 px-3 py-3 transition-colors hover:bg-background/75"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{(item as MessageLike).subject}</p>
                        {(item as MessageLike).unreadCount > 0 ? (
                          <span className="inline-flex size-2 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {(item as MessageLike).entityLabel}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{(item as MessageLike).snippet}</p>
                    </div>
                    <StatusBadge tone={(item as MessageLike).unreadCount > 0 ? "info" : "neutral"} size="sm">
                      {(item as MessageLike).time}
                    </StatusBadge>
                  </div>
                </Link>
              )
            )
          )}
        </div>
        <DropdownMenuSeparator />
        <Link
          href={props.href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mx-1 mt-1 w-[calc(100%-0.5rem)] justify-center")}
        >
          View All
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
