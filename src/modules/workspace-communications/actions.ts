"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { canSendWorkspaceMessages, canViewWorkspaceMessages, canViewWorkspaceNotifications } from "@/lib/users/actor-permissions";
import {
  markAllNotificationsRead,
  markNotificationRead,
  sendWorkflowMessage,
  type WorkspaceActorContext,
} from "@/modules/workspace-communications/service";

function buildActorContext() {
  return requireUserProfile().then(({ user, profile }) => {
    const role = resolveAppRole(user, profile);
    return {
      actor: {
        userId: profile?.id ?? user.id,
        organizationId: profile?.organization_id ?? null,
        role,
        displayName: getUserDisplayName(profile, user),
      } satisfies WorkspaceActorContext,
      role,
    };
  });
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  if (!notificationId) return;

  const { actor, role } = await buildActorContext();
  if (!canViewWorkspaceNotifications(role)) return;

  try {
    const service = createServiceRoleClient();
    await markNotificationRead({ service, actor, notificationId });
  } catch {}
  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.dashboard);
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const unreadOnly = String(formData.get("mode") ?? "") === "unread";

  const { actor, role } = await buildActorContext();
  if (!canViewWorkspaceNotifications(role)) return;

  try {
    const service = createServiceRoleClient();
    await markAllNotificationsRead({ service, actor, unreadOnly });
  } catch {}
  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.dashboard);
}

export async function sendWorkflowMessageAction(formData: FormData) {
  const threadId = String(formData.get("threadId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!threadId || !body) return;

  const { actor, role } = await buildActorContext();
  if (!canViewWorkspaceMessages(role) || !canSendWorkspaceMessages(role)) return;

  try {
    const service = createServiceRoleClient();
    await sendWorkflowMessage({ service, actor, threadId, body });
  } catch {}
  revalidatePath(ROUTES.messages);
  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.dashboard);
}
