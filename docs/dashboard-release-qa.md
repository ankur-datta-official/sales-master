# Dashboard Release QA Matrix

## Automated Gate

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Manual Role QA

Run the checklist below for each role:

- `admin`
- `hos`
- `manager`
- `assistant_manager`
- `marketer`
- `accounts`
- `factory_operator`

For each role verify:

1. Login lands on the expected workspace dashboard.
2. Sidebar groups and menu labels match the intended role experience.
3. The topbar search placeholder feels role-specific and not generic.
4. Dashboard hero, KPI row, action strip, and primary tables render without empty-state regressions.
5. Dashboard CTA opens an allowed reporting surface.
6. New workspace pages open only if the role should have access:
   - `notifications`
   - `documents`
   - `monthly-budget`
   - `settings`
   - `export-data`
7. Manually opening a disallowed route redirects back to dashboard.
8. Sidebar collapse works on desktop.
9. Mobile/tablet layout keeps content readable and navigation reachable.
10. No unauthorized menu item is visible for the active role.

## Focused Scenario Checks

- `marketer`: own-scope cards, budget semantics, documents list, and collection/order links feel personal rather than org-wide.
- `accounts`: approvals, due exposure, and document surfaces feel accounts-oriented and do not expose irrelevant delivery/admin copy.
- `factory_operator`: delivery dashboard, queue links, challan records, and notifications feel dispatch-centric.
- leadership roles: cross-team cards and tables keep the broader operational picture without marketer-only language.

## Sign-off Rule

Release should not be marked ready until:

- automated gate passes
- all 7 roles complete the manual matrix
- any intentional remaining lint warnings are explicitly acknowledged as pre-existing and unrelated
