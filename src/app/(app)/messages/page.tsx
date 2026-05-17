import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { canSendWorkspaceMessages, canViewWorkspaceMessages } from "@/lib/users/actor-permissions";
import { sendWorkflowMessageAction } from "@/modules/workspace-communications/actions";
import {
  ensureWorkflowThreadForActor,
  getMessageThreadDetail,
  getWorkspaceMessagePreview,
  getWorkspaceMessageSummaries,
} from "@/modules/workspace-communications/service";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MessagesPage({ searchParams }: PageProps) {
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canViewWorkspaceMessages(role)) {
    redirect(ROUTES.dashboard);
  }

  const actor = {
    userId: profile?.id ?? user.id,
    organizationId: profile?.organization_id ?? null,
    role,
    displayName: getUserDisplayName(profile, user),
  };
  const rawSearchParams = await searchParams;
  const requestedThreadId = String(rawSearchParams.threadId ?? "").trim();
  const entityType = String(rawSearchParams.entityType ?? "").trim();
  const entityId = String(rawSearchParams.entityId ?? "").trim();

  let ensuredThreadId = requestedThreadId;
  let preview = { unreadCount: 0, items: [] as Array<unknown> };
  let summaries = [] as Awaited<ReturnType<typeof getWorkspaceMessageSummaries>>;
  let activeThread = null as Awaited<ReturnType<typeof getMessageThreadDetail>>;

  try {
    const service = createServiceRoleClient();

    if (!ensuredThreadId && entityType && entityId) {
      const thread = await ensureWorkflowThreadForActor({
        service,
        actor,
        entityType,
        entityId,
      });
      ensuredThreadId = thread?.id ?? "";
    }

    [preview, summaries] = await Promise.all([
      getWorkspaceMessagePreview({ service, actor }),
      getWorkspaceMessageSummaries({ service, actor }),
    ]);

    const activeThreadId = ensuredThreadId || summaries[0]?.id || "";
    activeThread = activeThreadId
      ? await getMessageThreadDetail({ service, actor, threadId: activeThreadId })
      : null;
  } catch {
    preview = { unreadCount: 0, items: [] };
    summaries = [];
    activeThread = null;
  }

  const activeThreadId = ensuredThreadId || summaries[0]?.id || "";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Messages"
        description="Workflow-linked team conversations tied to approvals, collections, dispatches, plans, and reports."
        actions={
          <>
            <StatusBadge tone={preview.unreadCount > 0 ? "info" : "neutral"}>
              {preview.unreadCount} unread
            </StatusBadge>
            <Link href={ROUTES.dashboard} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Back to dashboard
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <Card className="min-h-[620px]">
          <CardHeader>
            <CardTitle>Workflow Inbox</CardTitle>
            <CardDescription>Recent workflow conversations you participate in or can monitor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaries.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                Workflow-linked conversations will appear here as approvals and review notes generate threads.
              </div>
            ) : (
              summaries.map((thread) => (
                <Link
                  key={thread.id}
                  href={`${ROUTES.messages}?threadId=${thread.id}`}
                  className={`block rounded-2xl border px-4 py-3 transition-colors ${
                    thread.id === activeThreadId ? "border-primary/35 bg-primary/8" : "bg-background/45 hover:bg-background/75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{thread.subject}</p>
                        {thread.unreadCount > 0 ? (
                          <StatusBadge tone="info" size="sm">
                            {thread.unreadCount} new
                          </StatusBadge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {thread.entityLabel}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{thread.lastSnippet}</p>
                    </div>
                    <StatusBadge tone="neutral">{new Date(thread.lastMessageAt).toLocaleDateString("en-GB")}</StatusBadge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[620px]">
          <CardHeader>
            <CardTitle>{activeThread?.subject ?? "Thread Detail"}</CardTitle>
            <CardDescription>
              {activeThread
                ? `${activeThread.entityLabel} conversation with workflow context and participant-safe replies.`
                : "Select a workflow conversation from the inbox to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeThread ? (
              <>
                <div className="rounded-2xl border bg-background/45 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-2xl border bg-card/80 p-2.5 text-muted-foreground">
                        <MessageSquare className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{activeThread.entityLabel}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          This thread is linked to the source workflow record.
                        </p>
                      </div>
                    </div>
                    <Link href={activeThread.entityHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Open source
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border bg-background/45 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Participants</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeThread.participants.map((participant) => (
                      <div key={participant.userId} className="rounded-full border bg-card/70 px-3 py-1.5">
                        <p className="text-xs font-semibold">{participant.name}</p>
                        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                          {participant.roleLabel}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border bg-background/35 p-4">
                  {activeThread.entries.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No messages in this thread yet.
                    </p>
                  ) : (
                    activeThread.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-2xl border px-4 py-3 ${
                          entry.isOwn ? "ml-auto max-w-[88%] bg-primary/8 border-primary/18" : "max-w-[92%] bg-card/72"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{entry.senderName}</p>
                          <div className="flex items-center gap-2">
                            <StatusBadge tone={entry.messageType === "system" ? "warning" : "neutral"} size="sm">
                              {entry.messageType === "system" ? "Workflow" : "Reply"}
                            </StatusBadge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString("en-GB")}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{entry.body}</p>
                      </div>
                    ))
                  )}
                </div>

                {canSendWorkspaceMessages(role) ? (
                  <form action={sendWorkflowMessageAction} className="space-y-3 rounded-2xl border bg-background/45 p-4">
                    <input type="hidden" name="threadId" value={activeThread.id} />
                    <div>
                      <p className="text-sm font-semibold">Reply to this workflow</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Keep communication tied to the business context for approval and audit clarity.
                      </p>
                    </div>
                    <Textarea
                      name="body"
                      rows={4}
                      placeholder="Write a workflow-aware reply..."
                    />
                    <div className="flex justify-end">
                      <button type="submit" className={buttonVariants({ variant: "default", size: "sm" })}>
                        Send message
                      </button>
                    </div>
                  </form>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
                No accessible thread selected. Open a workflow conversation from the inbox or from a linked workflow record.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
