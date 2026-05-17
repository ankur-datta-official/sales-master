import { NextResponse } from "next/server";

import { resolveAppRole } from "@/lib/auth/app-role";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { fetchProfileByUserId } from "@/lib/profiles/fetch-profile";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { canViewWorkspaceMessages } from "@/lib/users/actor-permissions";
import { getWorkspaceMessagePreview } from "@/modules/workspace-communications/service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  const role = resolveAppRole(user, profile);
  if (!canViewWorkspaceMessages(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let data = { unreadCount: 0, items: [] as Array<unknown> };
  try {
    const service = createServiceRoleClient();
    data = await getWorkspaceMessagePreview({
      service,
      actor: {
        userId: profile?.id ?? user.id,
        organizationId: profile?.organization_id ?? null,
        role,
        displayName: getUserDisplayName(profile, user),
      },
    });
  } catch {
    data = { unreadCount: 0, items: [] };
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
