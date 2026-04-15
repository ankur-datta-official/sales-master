# Sales Master WebApp v1 - Go-Live Packet

Last updated: 2026-04-15

## 1) Scope of hardening completed

- Tenant isolation hardening added for `public.organizations` using RLS + `FORCE ROW LEVEL SECURITY`.
- Location-pings API read path now enforces explicit session access checks before returning tracking history.
- Service-role Supabase client guarded with `server-only` import.
- Security headers baseline configured in `next.config.ts` (CSP, frame, referrer, content-type, permissions policy).
- CI workflow added to enforce lint + typecheck + production build on PR and main.
- Centralized safe action error mapper added:
  - `src/lib/errors/safe-action-error.ts`
  - Action modules switched from raw backend error leakage to safe fallback messages.
- UI pages updated to avoid rendering raw backend error details.
- Health/readiness endpoint added:
  - `GET /api/health`

## 2) Verification evidence (executed)

- `npm run ci` -> PASS
  - lint: pass with 1 existing warning (`today-attendance-panel.tsx`, hook dependency warning)
  - typecheck: pass
  - build: pass
- `npm audit --audit-level=high` -> PASS (0 vulnerabilities found)

## 3) Release-critical gates (must pass)

- [x] `npm run launch:verify`
- [x] Supabase migrations include organizations RLS hardening migration
- [x] API/location access control check in place for session-based location history
- [x] Security headers configured
- [x] Service-role client is server-only
- [x] Raw DB/provider errors not exposed in user-facing action responses

## 4) Manual pre-launch checks (operations)

- [ ] Run DB migration in staging and production in controlled order.
- [ ] Validate cross-tenant access isolation with two org test users.
- [ ] Validate role hierarchy review paths:
  - demand order manager review
  - accounts review
  - factory queue visibility
- [ ] Validate attendance + location ping flow end-to-end on real devices/network.
- [ ] Hit `/api/health` after deploy and confirm status `ok`.

## 5) Rollback plan (minimum)

- Keep previous deployment artifact available for immediate rollback.
- If migration-related issue occurs:
  - stop writes to impacted module,
  - roll back app deployment first,
  - apply DB corrective migration (forward-fix preferred over destructive rollback).
- Re-run `npm run launch:verify` and staging smoke tests before re-attempt.

## 6) Post-launch monitoring checklist (Day 0 to Day 2)

- [ ] Watch auth/login failure patterns.
- [ ] Watch API 4xx/5xx spikes, especially `location-pings`, demand order approval actions.
- [ ] Track query performance and DB CPU after migration.
- [ ] Validate no unexpected permission denials for valid manager/accounts users.

