import { NextResponse } from "next/server";

import { resolveAppRole } from "@/lib/auth/app-role";
import { getUserDisplayName } from "@/lib/profiles/display-name";
import { fetchProfileByUserId } from "@/lib/profiles/fetch-profile";
import { createClient } from "@/lib/supabase/server";
import { parseCeoDashboardSearchParams } from "@/modules/dashboard/ceo-filters";
import { buildDashboardCsvContent } from "@/modules/dashboard/export";
import { getDashboardData } from "@/modules/dashboard/service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  const role = resolveAppRole(user, profile);
  if (role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filters = parseCeoDashboardSearchParams(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  const dashboard = await getDashboardData({
    supabase,
    role,
    userId: profile?.id ?? user.id,
    userName: getUserDisplayName(profile, user),
    ceoFilters: filters,
  });

  const csv = buildDashboardCsvContent(dashboard);
  const filename = [
    "ceo-dashboard-report",
    filters.dateFrom,
    "to",
    filters.dateTo,
  ].join("-") + ".csv";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

