import assert from "node:assert/strict";

import { getWorkspaceDefinition, flattenWorkspaceItems } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import { getPostLoginRedirectPath } from "@/lib/auth/post-login-redirect";
import { getRolePresentation } from "@/lib/auth/role-presentation";
import {
  canViewWorkspaceDocuments,
  canViewWorkspaceExportData,
  canViewWorkspaceMessages,
  canViewWorkspaceMonthlyBudget,
  canViewWorkspaceNotifications,
  canSendWorkspaceMessages,
  canViewWorkspaceSettings,
} from "@/lib/users/actor-permissions";
import {
  buildCeoDashboardHref,
  parseCeoDashboardSearchParams,
} from "@/modules/dashboard/ceo-filters";
import { getDashboardLayoutSpec } from "@/modules/dashboard/layout-spec";

function run(name: string, check: () => void) {
  try {
    check();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("all app roles land on dashboard after login by default", () => {
  const roles = ["admin", "hos", "manager", "assistant_manager", "marketer", "accounts", "factory_operator"] as const;
  for (const role of roles) {
    assert.equal(getPostLoginRedirectPath(role), ROUTES.dashboard);
  }
});

run("workspace navigation stays role-specific for marketer and admin", () => {
  const marketerItems = flattenWorkspaceItems(getWorkspaceDefinition("marketer").sections).map((item) => item.href);
  const adminItems = flattenWorkspaceItems(getWorkspaceDefinition("admin").sections).map((item) => item.href);

  assert.ok(marketerItems.includes(ROUTES.monthlyBudget));
  assert.ok(marketerItems.includes(ROUTES.documents));
  assert.ok(!marketerItems.includes(ROUTES.exportData));

  assert.ok(adminItems.includes(ROUTES.exportData));
  assert.ok(adminItems.includes(ROUTES.documents));
  assert.ok(!adminItems.includes(ROUTES.monthlyBudget));
});

run("workspace route helpers enforce expected access", () => {
  assert.equal(canViewWorkspaceNotifications("marketer"), true);
  assert.equal(canViewWorkspaceMessages("assistant_manager"), true);
  assert.equal(canSendWorkspaceMessages("factory_operator"), true);
  assert.equal(canViewWorkspaceDocuments("factory_operator"), true);
  assert.equal(canViewWorkspaceSettings("accounts"), true);
  assert.equal(canViewWorkspaceMonthlyBudget("assistant_manager"), false);
  assert.equal(canViewWorkspaceMonthlyBudget("manager"), true);
  assert.equal(canViewWorkspaceExportData("admin"), true);
  assert.equal(canViewWorkspaceExportData("hos"), false);
});

run("dashboard variants resolve to stable layout families", () => {
  assert.equal(getRolePresentation("admin").variant, "ceo");
  assert.equal(getDashboardLayoutSpec("ceo").family, "leadership");
  assert.equal(getDashboardLayoutSpec("marketer").family, "marketer");
  assert.equal(getDashboardLayoutSpec("accounts").family, "accounts");
  assert.equal(getDashboardLayoutSpec("delivery").family, "delivery");
  assert.equal(getDashboardLayoutSpec("ceo").expectedSectionCount, 5);
  assert.equal(getDashboardLayoutSpec("marketer").expectedSectionCount, 3);
});

run("ceo dashboard filters fall back safely and normalize invalid input", () => {
  const parsed = parseCeoDashboardSearchParams({
    division: "branch-1",
    zone: "branch-2",
    dateFrom: "2026-05-20",
    dateTo: "2026-05-01",
    view: "invalid-view",
  });

  assert.equal(parsed.division, "branch-1");
  assert.equal(parsed.zone, "branch-2");
  assert.equal(parsed.dateFrom, "2026-05-01");
  assert.equal(parsed.dateTo, "2026-05-20");
  assert.equal(parsed.view, "executive_overview");
});

run("ceo dashboard href builder preserves current filter context", () => {
  const href = buildCeoDashboardHref(ROUTES.analytics, {
    division: "dhaka",
    zone: "north",
    dateFrom: "2026-05-01",
    dateTo: "2026-05-17",
    view: "zones",
  });

  assert.equal(
    href,
    "/analytics?division=dhaka&zone=north&view=zones&dateFrom=2026-05-01&dateTo=2026-05-17"
  );
});

console.log("Workspace and role guard checks passed.");
