# Project Context

This document summarizes the current `sales-master-webapp` codebase for another AI or engineer.
It is derived from the repository source files, route handlers, server actions, constants, and Supabase migrations.

## Folder Structure (2 Levels Deep)

```text
sales-master-webapp/
  .github/
    workflows/
  docs/
  public/
  src/
    app/
    components/
    config/
    constants/
    hooks/
    lib/
    modules/
    types/
  supabase/
    migrations/
    sql/
  .env.example
  .env.local
  .env.local.example
  .gitignore
  AGENTS.md
  CLAUDE.md
  components.json
  eslint.config.mjs
  middleware.ts
  next-env.d.ts
  next.config.ts
  package-lock.json
  package.json
  postcss.config.mjs
  README.md
  tsconfig.json

src/app/
  (app)/
  (auth)/
  api/
  auth/
  favicon.ico
  globals.css
  layout.tsx
  page.tsx

src/components/
  layout/
  ui/

src/config/
  navigation.ts
  routes.ts

src/constants/
  index.ts
  roles.ts
  statuses.ts

src/hooks/
  use-mobile.ts

src/lib/
  auth/
  errors/
  profiles/
  supabase/
  users/
  utils.ts

src/modules/
  analytics/
  approval-logs/
  attendance/
  collection-entries/
  collection-targets/
  dashboard/
  demand-orders/
  factory-dispatches/
  field-activity/
  location-pings/
  parties/
  products/
  sales-entries/
  sales-targets/
  users/
  visit-logs/
  visit-plans/
  work-plans/
  work-reports/

src/types/
  profile.ts

supabase/migrations/
  20260411000000_profiles.sql
  20260411_001_auth_hierarchy_foundation.sql
  20260414000000_reconcile_auth_foundation.sql
  20260415000000_hierarchy_rpc_and_profiles_rls.sql
  20260415010000_organizations_rls_hardening.sql
  20260416000000_parties_module.sql
  20260417000000_products_module.sql
  20260418000000_work_plans_module.sql
  20260419000000_work_reports_module.sql
  20260420000000_visit_plans_module.sql
  20260421000000_visit_logs_module.sql
  20260422000000_sales_targets_module.sql
  20260423000000_collection_targets_module.sql
  20260424000000_sales_entries_module.sql
  20260425000000_collection_entries_module.sql
  20260426000000_demand_orders_module.sql
  20260427000000_approval_logs_demand_order_review.sql
  20260428000000_accounts_review_demand_orders.sql
  20260429000000_demand_order_dispatches.sql
  20260430000000_attendance_module.sql
  20260430010000_fix_attendance_policy_recursion.sql
  20260430020000_location_pings_module.sql
  20260430030000_fix_work_plan_report_draft_rls.sql

supabase/sql/
  hierarchy_access_helpers.sql
```

## Environment Variables

Keys discovered from `.env.example`, `.env.local.example`, `.env.local`, and `process.env.*` usage:

| Key | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser/server Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preferred | Main public Supabase key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional fallback | Legacy fallback if publishable key is unset |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Required for server-side admin/provisioning flows |
| `HEALTHCHECK_TOKEN` | Optional | Protects `/api/health` if set |

## API Routes

Routes found under `src/app/api`:

| Route | Methods | Source File | Purpose |
| --- | --- | --- | --- |
| `/api/health` | `GET` | `src/app/api/health/route.ts` | Health check endpoint that validates required env configuration and can require a bearer/query token |
| `/api/location-pings` | `GET`, `POST` | `src/app/api/location-pings/route.ts` | Records field activity location pings and reads recent session or last-known location data |

## Server Actions

Server actions are exported async functions in files declaring `"use server"`.

| Action | Source File | Purpose |
| --- | --- | --- |
| `resolvePostLoginPathAction` | `src/app/(auth)/login/actions.ts` | Computes the safe post-login redirect path |
| `checkInAttendanceAction` | `src/modules/attendance/actions.ts` | Creates a check-in attendance session |
| `checkOutAttendanceAction` | `src/modules/attendance/actions.ts` | Completes an open attendance session |
| `createCollectionEntryAction` | `src/modules/collection-entries/actions.ts` | Creates a collection entry |
| `updateCollectionEntryAction` | `src/modules/collection-entries/actions.ts` | Updates a collection entry |
| `verifyCollectionEntryAction` | `src/modules/collection-entries/actions.ts` | Verifies or rejects a collection entry |
| `createCollectionTargetAction` | `src/modules/collection-targets/actions.ts` | Creates a collection target |
| `updateCollectionTargetAction` | `src/modules/collection-targets/actions.ts` | Updates a collection target |
| `accountsApproveDemandOrderAction` | `src/modules/demand-orders/accounts-actions.ts` | Accounts-side approval to release a demand order toward factory flow |
| `accountsRejectDemandOrderAction` | `src/modules/demand-orders/accounts-actions.ts` | Accounts-side rejection of a demand order |
| `createDemandOrderAction` | `src/modules/demand-orders/actions.ts` | Creates a draft demand order |
| `updateDraftDemandOrderAction` | `src/modules/demand-orders/actions.ts` | Updates a draft demand order |
| `submitDemandOrderAction` | `src/modules/demand-orders/actions.ts` | Submits a demand order for review |
| `approveDemandOrderAction` | `src/modules/demand-orders/approval-actions.ts` | Approves a demand order in manager/HOS review |
| `rejectDemandOrderAction` | `src/modules/demand-orders/approval-actions.ts` | Rejects a demand order in review |
| `forwardDemandOrderAction` | `src/modules/demand-orders/approval-actions.ts` | Forwards a demand order into under-review flow |
| `updateFactoryDispatchAction` | `src/modules/factory-dispatches/actions.ts` | Updates factory dispatch progress/status fields |
| `createLocationPingAction` | `src/modules/location-pings/actions.ts` | Records a location ping tied to attendance |
| `createPartyAction` | `src/modules/parties/actions.ts` | Creates a party/customer record |
| `updatePartyAction` | `src/modules/parties/actions.ts` | Updates a party/customer record |
| `createProductAction` | `src/modules/products/actions.ts` | Creates a product |
| `updateProductAction` | `src/modules/products/actions.ts` | Updates a product |
| `createSalesEntryAction` | `src/modules/sales-entries/actions.ts` | Creates a sales entry |
| `updateSalesEntryAction` | `src/modules/sales-entries/actions.ts` | Updates a sales entry |
| `createSalesTargetAction` | `src/modules/sales-targets/actions.ts` | Creates a sales target |
| `updateSalesTargetAction` | `src/modules/sales-targets/actions.ts` | Updates a sales target |
| `createOrgUserAction` | `src/modules/users/actions.ts` | Creates a new organization user/profile |
| `updateOrgUserAction` | `src/modules/users/actions.ts` | Updates an organization user/profile |
| `createVisitLogAction` | `src/modules/visit-logs/actions.ts` | Creates a visit log |
| `updateVisitLogAction` | `src/modules/visit-logs/actions.ts` | Updates a visit log |
| `createVisitPlanAction` | `src/modules/visit-plans/actions.ts` | Creates a visit plan |
| `updatePlannedVisitPlanAction` | `src/modules/visit-plans/actions.ts` | Updates a planned visit plan |
| `updateVisitPlanStatusAction` | `src/modules/visit-plans/actions.ts` | Changes a visit plan status |
| `createWorkPlanAction` | `src/modules/work-plans/actions.ts` | Creates a work plan |
| `updateDraftWorkPlanAction` | `src/modules/work-plans/actions.ts` | Updates a draft work plan |
| `submitWorkPlanAction` | `src/modules/work-plans/actions.ts` | Submits a work plan for review |
| `reviewWorkPlanAction` | `src/modules/work-plans/actions.ts` | Approves or rejects a work plan |
| `createWorkReportAction` | `src/modules/work-reports/actions.ts` | Creates a work report |
| `updateDraftWorkReportAction` | `src/modules/work-reports/actions.ts` | Updates a draft work report |
| `submitWorkReportAction` | `src/modules/work-reports/actions.ts` | Submits a work report for review |
| `reviewWorkReportAction` | `src/modules/work-reports/actions.ts` | Approves or rejects a work report |

## TypeScript Types from `src/types`

### `UserProfile`

Source: `src/types/profile.ts`

```ts
type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  phone: string | null;
  employee_code: string | null;
  designation: string | null;
  organization_id: string | null;
  branch_id: string | null;
  role_id: string | null;
  reports_to_user_id: string | null;
  is_field_user: boolean | null;
  joined_at: string | null;
  display_name?: string | null;
  role?: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

Notes:
- This type is intentionally tolerant while the app moves from a lightweight auth profile table to the fuller business profile schema.
- `display_name` and `role` are legacy/lightweight optional fields.

## Database Tables and Columns

The lists below reflect the effective table shape inferred from ordered Supabase migrations.
Duplicate table definitions were merged, and later migration changes were applied where relevant.

### `public.organizations`

Columns:
- `id`
- `name`
- `slug`
- `status`
- `created_at`
- `updated_at`

### `public.branches`

Columns:
- `id`
- `organization_id`
- `name`
- `code`
- `is_head_office`
- `status`
- `created_at`
- `updated_at`

### `public.roles`

Columns:
- `id`
- `organization_id`
- `name`
- `slug`
- `level`
- `description`
- `is_system`
- `status`
- `created_at`
- `updated_at`

### `public.profiles`

Effective columns merged from the lightweight auth profile migration and the later auth foundation reconciliation:
- `id`
- `organization_id`
- `branch_id`
- `role_id`
- `reports_to_user_id`
- `full_name`
- `email`
- `display_name`
- `role`
- `phone`
- `employee_code`
- `designation`
- `avatar_url`
- `is_field_user`
- `status`
- `joined_at`
- `created_at`
- `updated_at`

### `public.parties`

Columns:
- `id`
- `organization_id`
- `assigned_to_user_id`
- `name`
- `code`
- `contact_person`
- `phone`
- `email`
- `address`
- `notes`
- `status`
- `created_by_user_id`
- `created_at`
- `updated_at`

### `public.products`

Columns:
- `id`
- `organization_id`
- `product_name`
- `item_code`
- `unit`
- `base_price`
- `category`
- `description`
- `status`
- `created_by_user_id`
- `created_at`
- `updated_at`

### `public.work_plans`

Columns:
- `id`
- `organization_id`
- `owner_user_id`
- `plan_date`
- `title`
- `details`
- `priority`
- `status`
- `submitted_at`
- `reviewed_by`
- `reviewed_at`
- `review_note`
- `created_at`
- `updated_at`

### `public.work_reports`

Columns:
- `id`
- `organization_id`
- `owner_user_id`
- `report_date`
- `summary`
- `achievements`
- `challenges`
- `next_step`
- `status`
- `submitted_at`
- `reviewed_by`
- `reviewed_at`
- `review_note`
- `created_at`
- `updated_at`

### `public.visit_plans`

Columns:
- `id`
- `organization_id`
- `party_id`
- `user_id`
- `visit_date`
- `purpose`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### `public.visit_logs`

Columns:
- `id`
- `organization_id`
- `party_id`
- `user_id`
- `visit_plan_id`
- `check_in_time`
- `check_out_time`
- `check_in_lat`
- `check_in_lng`
- `check_out_lat`
- `check_out_lng`
- `notes`
- `outcome`
- `status`
- `created_at`
- `updated_at`

### `public.sales_targets`

Columns:
- `id`
- `organization_id`
- `assigned_to_user_id`
- `party_id`
- `period_type`
- `start_date`
- `end_date`
- `target_amount`
- `target_qty`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### `public.collection_targets`

Columns:
- `id`
- `organization_id`
- `assigned_to_user_id`
- `party_id`
- `period_type`
- `start_date`
- `end_date`
- `target_amount`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### `public.sales_entries`

Columns:
- `id`
- `organization_id`
- `user_id`
- `party_id`
- `entry_date`
- `amount`
- `quantity`
- `remarks`
- `source`
- `created_by`
- `created_at`
- `updated_at`

### `public.collection_entries`

Columns:
- `id`
- `organization_id`
- `user_id`
- `party_id`
- `entry_date`
- `amount`
- `remarks`
- `verification_status`
- `created_by`
- `created_at`
- `updated_at`

### `public.demand_orders`

Columns:
- `id`
- `organization_id`
- `party_id`
- `created_by_user_id`
- `order_date`
- `status`
- `stage`
- `total_amount`
- `remarks`
- `submitted_at`
- `created_at`
- `updated_at`

### `public.demand_order_items`

Columns:
- `id`
- `demand_order_id`
- `product_id`
- `quantity`
- `unit_price`
- `line_total`
- `remark`

### `public.approval_logs`

Columns:
- `id`
- `organization_id`
- `entity_type`
- `entity_id`
- `action`
- `from_user_id`
- `to_user_id`
- `acted_by_user_id`
- `note`
- `created_at`

### `public.demand_order_dispatches`

Columns:
- `id`
- `organization_id`
- `demand_order_id`
- `factory_status`
- `challan_no`
- `memo_no`
- `dispatch_date`
- `remarks`
- `updated_by`
- `created_at`
- `updated_at`

### `public.attendance_sessions`

Columns:
- `id`
- `organization_id`
- `user_id`
- `check_in_at`
- `check_in_lat`
- `check_in_lng`
- `check_in_address`
- `check_out_at`
- `check_out_lat`
- `check_out_lng`
- `check_out_address`
- `status`
- `device_info`
- `created_at`
- `updated_at`

### `public.location_pings`

Columns:
- `id`
- `organization_id`
- `attendance_session_id`
- `user_id`
- `captured_at`
- `lat`
- `lng`
- `accuracy`
- `speed`
- `source`
- `created_at`

## Constants and Enum-Like Values

### Roles

Source: `src/constants/roles.ts`

- `APP_ROLES = ["admin", "hos", "manager", "assistant_manager", "marketer", "accounts", "factory_operator"]`
- `AppRole = (typeof APP_ROLES)[number]`
- `isAppRole(value)` type guard validates against `APP_ROLES`

### Status and Domain Vocabulary Constants

Source: `src/constants/statuses.ts`

- `USER_STATUSES = ["active", "invited", "disabled"]`
- `RECORD_STATUSES = ["draft", "published", "archived"]`
- `PROFILE_LIFECYCLE_STATUSES = ["invited", "active", "inactive", "suspended"]`
- `PARTY_STATUSES = ["active", "inactive"]`
- `PRODUCT_STATUSES = ["active", "inactive"]`
- `WORK_PLAN_STATUSES = ["draft", "submitted", "approved", "rejected"]`
- `WORK_PLAN_PRIORITIES = ["low", "medium", "high"]`
- `WORK_REPORT_STATUSES = ["draft", "submitted", "approved", "rejected"]`
- `VISIT_PLAN_STATUSES = ["planned", "completed", "skipped", "cancelled"]`
- `VISIT_LOG_STATUSES = ["completed", "partial", "cancelled"]`
- `SALES_TARGET_STATUSES = ["draft", "active", "completed", "cancelled"]`
- `SALES_TARGET_PERIOD_TYPES = ["daily", "weekly", "monthly"]`
- `COLLECTION_TARGET_STATUSES = ["draft", "active", "completed", "cancelled"]`
- `COLLECTION_TARGET_PERIOD_TYPES = ["daily", "weekly", "monthly"]`
- `SALES_ENTRY_SOURCES = ["manual"]`
- `COLLECTION_ENTRY_VERIFICATION_STATUSES = ["unverified", "verified", "rejected"]`
- `DEMAND_ORDER_STATUSES = ["draft", "submitted", "under_review", "approved", "rejected", "sent_to_factory"]`
- `DEMAND_ORDER_STATUS = { draft, submitted, underReview, approved, rejected, sentToFactory }`
- `DEMAND_ORDER_STAGES = ["draft", "manager_review", "accounts_review", "factory_queue"]`
- `DEMAND_ORDER_STAGE = { draft, managerReview, accountsReview, factoryQueue }`
- `APPROVAL_LOG_ACTIONS = ["submit", "approve", "reject", "forward", "accounts_approve", "accounts_reject"]`
- `APPROVAL_LOG_ACTION = { submit, approve, reject, forward, accountsApprove, accountsReject }`
- `APPROVAL_LOG_ENTITY_TYPES = ["demand_order"]`
- `FACTORY_DISPATCH_STATUSES = ["pending", "processing", "ready", "dispatched", "delivered"]`
- `ATTENDANCE_SESSION_STATUSES = ["checked_in", "checked_out", "missed_checkout"]`
- `LOCATION_PING_SOURCES = ["web", "mobile", "manual", "system"]`

Each of these also exports a corresponding union type, such as `UserStatus`, `WorkPlanStatus`, `DemandOrderStage`, and `LocationPingSource`.

### Route Constants

Source: `src/config/routes.ts`

`ROUTES` currently defines:

- `login`
- `dashboard`
- `profile`
- `users`
- `usersNew`
- `parties`
- `partiesNew`
- `products`
- `productsNew`
- `workPlans`
- `workPlansNew`
- `workReports`
- `workReportsNew`
- `visitPlans`
- `visitPlansNew`
- `visitLogs`
- `visitLogsNew`
- `salesTargets`
- `salesTargetsNew`
- `collectionTargets`
- `collectionTargetsNew`
- `salesEntries`
- `salesEntriesNew`
- `collectionEntries`
- `collectionEntriesNew`
- `demandOrders`
- `demandOrdersNew`
- `approvals`
- `accountsReview`
- `factoryQueue`
- `attendance`
- `attendanceHistory`
- `fieldActivity`
- `analytics`
- `authCallback`

`PROTECTED_PATH_PREFIXES` includes these protected route prefixes:

- `/dashboard`
- `/profile`
- `/users`
- `/parties`
- `/products`
- `/work-plans`
- `/work-reports`
- `/visit-plans`
- `/visit-logs`
- `/sales-targets`
- `/collection-targets`
- `/sales-entries`
- `/collection-entries`
- `/demand-orders`
- `/approvals`
- `/accounts-review`
- `/factory-queue`
- `/attendance`
- `/field-activity`
- `/analytics`

### Navigation

Source: `src/config/navigation.ts`

- `NavItem` type:
  - `title: string`
  - `href: string`
  - `icon: LucideIcon`
  - `roles?: readonly AppRole[]`

- `mainNavigation` sidebar items:
  - `Dashboard`
  - `Profile`
  - `Attendance`
  - `Field activity`
  - `Analytics`
  - `Users`
  - `Parties`
  - `Products`
  - `Work Plans`
  - `Work Reports`
  - `Visit Plans`
  - `Visit Logs`
  - `Sales Targets`
  - `Collection Targets`
  - `Sales Entries`
  - `Collection Entries`
  - `Demand Orders`
  - `Approvals`
  - `Accounts review`
  - `Factory queue`

- Role-restricted navigation items:
  - `Field activity`: `assistant_manager`, `manager`, `hos`, `admin`
  - `Accounts review`: `accounts`, `admin`
  - `Factory queue`: `factory_operator`, `accounts`, `hos`, `manager`, `assistant_manager`, `admin`

- `filterNavByRoles(items, userRole)` returns only navigation items visible for the current role.
