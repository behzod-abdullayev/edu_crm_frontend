# Owner Panel Audit Report

**Scope:** Owner role panel (`/[locale]/owner/**`) and its shared services, across `edu-crm-fixed` (Next.js 15 / React 19 frontend) and `edu-crm-backend` (NestJS backend).

**Date:** 2026-06-10

**Method:** Full-stack sweep for mock data, hardcoded/untranslated strings, dead code, and frontend↔backend mismatches, followed by fixes applied in severity order (HIGH → MEDIUM → LOW).

---

## Summary

| # | Severity | Area | Status |
|---|----------|------|--------|
| 1 | HIGH | `HRPanel.tsx` — entirely hardcoded English | ✅ Fixed |
| 2 | HIGH | `OwnerHRClient.tsx` — entirely hardcoded English | ✅ Fixed |
| 3 | MEDIUM | `BranchManager.tsx` — dead, hardcoded, unused component | ✅ Removed |
| 4 | MEDIUM | `useOwnerBranches().editMutation` — calls non-existent backend endpoint | ✅ Removed |
| 5 | MEDIUM | `SystemConfigPanel.tsx` — zero i18n (717 lines) | ✅ Fixed |
| 6 | MEDIUM | `RolePermissionMatrix.tsx` — residual hardcoded strings | ✅ Fixed |
| 7 | LOW | `SystemConfigPanel` `ActionBar` — duplicate Clear Cache/Backup buttons bypassing confirm dialogs | ✅ Removed |
| 8 | LOW | `useOwnerSystem` hook — dead code, calls non-existent endpoints | ✅ Removed |
| 9 | LOW | `UserManagementFilterDto.branch` — accepted but ignored in `getUserManagement` | ✅ Fixed |

All 9 findings resolved. No remaining `TODO`/`FIXME`/mock data/hardcoded English strings found in the audited surface.

---

## Findings & Resolutions

### 1. [HIGH] `src/modules/owner/components/HRPanel.tsx` — entirely hardcoded English

**Issue:** All UI strings (table headers, filter labels, empty states, salary editor, contract status badges, ARIA labels) were hardcoded in English, bypassing the `next-intl` i18n system used everywhere else in the owner panel.

**Fix:**
- Added a new `owner.hr` namespace block (~36 keys) to `en.json`, `ru.json`, and `uz.json`, including translations for stat labels, table headers, filters, empty states, salary editing, and ARIA strings.
- Converted the module-level `salarySchema` (Zod) into a `getSalarySchema(t)` factory so validation messages are translated.
- Updated `ContractBadge`, `SalaryEditor`, `MobileStaffCard`, `FilterBar`, and the main `HRPanel` component to consume `useTranslations('owner.hr')` for all rendered text and ARIA attributes.

---

### 2. [HIGH] `src/app/[locale]/(dashboard)/owner/hr/OwnerHRClient.tsx` — entirely hardcoded English

**Issue:** Page title, description, stat card labels, "Staff Members" section header, total count text, empty states, and the contract-status legend were all hardcoded English.

**Fix:**
- Added `useTranslations('owner.hr')` and replaced every hardcoded string with translation keys from the same `owner.hr` namespace added in Finding #1 (`pageTitle`, `pageDesc`, `statTeachers`, `statAdmins`, `statActiveContracts`, `statExpired`, `statPayroll`, `staffMembers`, `totalCount`, `emptyTitle`, `emptyDesc`, `legendActive`, `legendExpired`, `legendPending`).

---

### 3. [MEDIUM] `src/modules/owner/components/BranchManager.tsx` — dead, hardcoded, unused component

**Issue:** A 724-line component containing hardcoded English UI strings and full branch CRUD logic, but verified via grep to have **zero references** anywhere in the codebase. Fully superseded by `BranchesClient.tsx`, which implements the same functionality with i18n and a different (working) API integration.

**Fix:** Deleted `BranchManager.tsx` entirely. No other files reference it.

---

### 4. [MEDIUM] `src/modules/owner/hooks/useOwner.ts` — `useOwnerBranches().editMutation` calls a non-existent endpoint

**Issue:** `editMutation` issued `PATCH /owner/branches/${id}`, but no such route exists on the backend (`owner.controller.ts` has no matching handler). This was dead/broken code — any caller would receive a 404. The live `BranchesClient.tsx` already uses a different, working code path (`ownerApi` direct POST calls).

**Fix:**
- Removed `editMutation`, `editBranch`, and `isEditing` from `useOwnerBranches`.
- No call sites were affected (confirmed via grep — nothing consumed `editBranch`/`isEditing`).

---

### 5. [MEDIUM] `src/modules/owner/components/SystemConfigPanel.tsx` — zero i18n (717 lines)

**Issue:** Despite the parent page (`OwnerSystemClient.tsx`) being fully translated, this 717-line component (maintenance mode, feature flags, SMTP settings, action bar, confirm dialog) contained entirely hardcoded English strings, including two large lookup constants (`FEATURE_FLAG_LABELS`, `FEATURE_FLAG_DESCRIPTIONS`).

**Fix:**
- Added a new `owner.system.panel` sub-namespace to `en.json`, `ru.json`, and `uz.json` covering all component-specific strings (maintenance descriptions, feature flag labels/descriptions for `payments`, `chat`, `certificates`, `exams`, `analytics`, SMTP labels, ARIA strings, confirm dialog text).
- Reused existing top-level `owner.system` keys (`maintenance`, `save`, `saving`, `savedAt`, `cancel`) where text matched exactly, avoiding duplicate translation work.
- Removed the `FEATURE_FLAG_LABELS`/`FEATURE_FLAG_DESCRIPTIONS` constants; labels/descriptions are now resolved dynamically via `t(\`panel.featureFlags.${key}.label\`)` / `.desc`.
- Added `useTranslations('owner.system')` to `MaintenanceSection`, `FeatureFlagsSection`, `SmtpSection`, `ActionBar`, and `ConfirmMaintenanceDialog`.

---

### 6. [MEDIUM] `src/modules/owner/components/RolePermissionMatrix.tsx` (611 lines) — residual hardcoded strings

**Issue:** While most of the component was translated, several strings remained hardcoded:
- `aria-label="Create a custom role"`
- `"Permission"` table column header
- Two duplicate Revoke/Grant ARIA-label templates (one in `MobileCategoryAccordion`, one in `CategoryRows`) that built strings like `` `${hasPermission ? 'Revoke' : 'Grant'} ${perm.label} for ${role.displayName}` ``
- Table/region ARIA labels (`"Permission matrix table"`, `"Permission matrix (mobile)"`)

**Fix:**
- Added new `owner.roles` keys to `en.json`, `ru.json`, `uz.json`: `permissionColumn`, `createCustomRoleAria`, `grantAction`, `revokeAction`, `togglePermissionAria` (ICU placeholders `{action} {permission} {role}`), `permissionMatrixTableAria`, `permissionMatrixMobileAria`.
- Replaced all hardcoded strings/ARIA labels with `t(...)` calls, including adding `useTranslations('owner.roles')` to `CategoryRows` (which previously had no translation hook).
- Verified via grep: no remaining `aria-label="[A-Z]...` (hardcoded English ARIA) patterns in the file.

---

### 7. [LOW] `SystemConfigPanel` `ActionBar` duplicates Clear Cache / Trigger Backup buttons without confirm dialogs

**Issue:** `ActionBar` (inside `SystemConfigPanel.tsx`) rendered its own "Clear cache" and "Trigger backup" buttons that called `onClearCache`/`onTriggerBackup` directly — bypassing the confirm-dialog UX flow that the parent `OwnerSystemClient.tsx` already implements correctly for the same actions in its "Quick Actions" section.

**Fix:**
- Removed the duplicate buttons and their handlers from `ActionBar` and `SystemConfigPanel` (`onClearCache`/`onTriggerBackup` props, `isClearingCache`/`isBackingUp` state, `handleClearCache`/`handleBackup`).
- Updated the `<SystemConfigPanel>` call site in `OwnerSystemClient.tsx` to drop the now-removed props.
- Confirmed `handleClearCache`/`handleTriggerBackup` remain wired to the existing Quick Actions confirm dialogs in `OwnerSystemClient.tsx` — functionality is preserved, just no longer duplicated with a worse UX.

---

### 8. [LOW] `useOwnerSystem` hook (`useOwner.ts`) — dead code calling non-existent endpoints

**Issue:** A ~65-line `useOwnerSystem` hook (with `SystemQueryData`/`SystemConfig`/`SystemHealth` types, a query, `saveConfigMutation`, `clearCache`, `triggerBackup`) was unused — fully superseded by the separate `useSystemConfig`/`useSaveSystemConfig` hooks that the live `OwnerSystemClient.tsx` actually uses.

**Fix:**
- Removed the entire `useOwnerSystem` function and its now-unused type imports (`SystemConfig`, `SystemHealth`).
- Removed the now-unused `system: () => [...]` query key from `services/query/keys.factory.ts` (the `systemConfig` key used by the live hooks was kept).

---

### 9. [LOW] `UserManagementFilterDto.branch` accepted but never applied

**Issue:** `UserManagementFilterDto` (`edu-crm-backend/src/modules/owner/dto/user-management.dto.ts`) declares an optional `branch?: string` field with full validation decorators, but `OwnerService.getUserManagement` destructured the filters without `branch` and never added a corresponding `WHERE` condition — the SELECT already returns `u.branch`, but filtering by it silently did nothing.

**Fix:**
- Added `branch` to the destructured filters in `getUserManagement`.
- Added a `u.branch = $N` equality condition to `whereConditions`/`filterParams`, mirroring the existing `role`/`status` filter pattern (applies to both the count and data queries).

---

## Confirmed OK (no issues found)

The following files were reviewed and found to be correctly implemented, fully translated, and free of mock data or dead endpoints:

- `OwnerProfileClient.tsx`
- `owner/settings/page.tsx`
- `OwnerSystemClient.tsx`
- `MultiTenantAnalytics.tsx`
- `GlobalKPIDashboard.tsx`
- `owner.mapper.ts`
- Backend `owner.service.ts` (in-scope methods other than `getUserManagement`)
- `owner.controller.ts`
- Owner DTOs (other than `UserManagementFilterDto.branch`)

---

## Verification

- All edited locale files (`en.json`, `ru.json`, `uz.json`) validated as well-formed JSON.
- `npx tsc --noEmit` passes with 0 errors on both `edu-crm-fixed` and `edu-crm-backend`.
- ESLint run on all modified files; no new lint errors introduced beyond pre-existing repo-wide formatting debt (CRLF/prettier) unrelated to this audit.
