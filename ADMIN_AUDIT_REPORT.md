# Admin Panel Audit Report

**Scope:** Admin role panel (`/[locale]/admin/**`) — dashboard, courses (+ `[id]`), teachers,
students, schedule, payments (+ `[id]`), reports, analytics, settings, profile — and its
shared services, across `edu-crm-fixed` (Next.js 15 / React 19 frontend) and
`edu-crm-backend` (NestJS backend).

**Date:** 2026-06-12

**Method:** Live walkthrough of every admin route in all three locales (uz/en/ru) as the
seeded `admin@gmail.com` account, full-stack sweep for mock data, hardcoded/untranslated
strings, dead code, and frontend↔backend contract mismatches, followed by fixes applied
page-by-page in the order the live walkthrough surfaced them. Follows the structure of the
prior [Owner Panel audit](AUDIT_REPORT.md).

---

## Summary

| # | Severity | Area | Status |
|---|----------|------|--------|
| 5.1 | HIGH | Dashboard — `/api/admin/dashboard` 404, zero i18n | ✅ Fixed |
| 5.2 | HIGH | Courses — raw API shape never mapped, table empty | ✅ Fixed |
| 5.3 | HIGH | Teachers — wrong endpoint, zero results, zero i18n | ✅ Fixed |
| 5.4 | HIGH | Students — raw API shape, duplicate empty states, zero i18n | ✅ Fixed |
| 5.5 | HIGH | Schedule — duplicate create-event forms, broken calendar query | ✅ Fixed |
| 5.6 | HIGH | Payments — pagination 422s, broken tab switching, zero i18n | ✅ Fixed |
| 5.7 | HIGH | Reports — `/api/admin/reports/*` 404, dead export options | ✅ Fixed |
| 5.8 | HIGH | Analytics — crashes on load, raw `.trend` key, fake charts | ✅ Fixed |
| 5.9 | MEDIUM | Settings — General/Pricing/Notifications tabs unwired, zero i18n | ✅ Fixed |
| 5.10 | MEDIUM | Profile — entirely hardcoded English, en-US-only date | ✅ Fixed |
| 5.11a | LOW | `errors.retry` MISSING_MESSAGE on every error state | ✅ Fixed |
| 5.11b | LOW | `/notifications/unread-count` 404 (mobile bottom nav badge) | ✅ Fixed |
| 5.11c | LOW | Dead `analyticsApi` module (159 lines, unused) | ✅ Removed |
| 5.11d | LOW | Stray empty directory under `admin/` | ✅ Removed |
| 5.11e | LOW | `teachers`/`students`/`settings` pages missing `generateMetadata` | ✅ Fixed |
| 6 | INFO | Teacher/Student status-toggle DTOs rejected `status` field | ✅ Fixed (backend) |
| 6 | INFO | Schedule calendar query used non-existent columns | ✅ Fixed (backend) |
| 6 | INFO | Debt/operational report SQL referenced non-existent tables/columns | ✅ Fixed (backend) |

All HIGH and MEDIUM findings resolved. All LOW/cross-cutting findings resolved except one
documented recommendation (see [Recommendations](#recommendations-not-blocking)).

---

## Findings & Resolutions

### 5.1 [HIGH] Dashboard — broken data fetch, zero i18n

**Issue:** `useAdminDashboard` called `fetch('/api/admin/dashboard')`, a route that does not
exist, so the dashboard permanently showed its error state. `AdminDashboardClient` and
`OperationalDashboard` also hardcoded every string (titles, KPI labels, chart titles, quick
actions, error/empty states, recent activity) in English.

**Fix:**
- `useAdminDashboard` now calls `adminApi.getDashboard()` via TanStack Query against
  `/api/v1/admin/dashboard`; `AdminDashboardStats` corrected to match the backend
  `AdminDashboardDto` shape.
- Backend: `getOverview`/`getDashboard`/`getAnalytics` referenced a non-existent
  `attendances` table and `marked_at` column (the entity is `attendance`/`date`) — fixed,
  removing the underlying 400s.
- Both components translated via per-component uz/en/ru `I18N` dicts (matching the
  Schedule/Teachers/Students pattern), with locale-aware `date-fns` formatting for the
  recent-activity feed.
- Frontend commit `72e6a48`; backend commit `319cce1`.

---

### 5.2 [HIGH] Courses — raw API response never mapped to the frontend shape

**Issue:** The backend returns courses as `{ data, meta }` with raw entity fields (`title`,
`teacher.user.firstName/lastName`, `enrolledCount`, `status: draft|published|archived`),
while the frontend `Course` type expected flat fields (`name`, `teacherName`,
`studentCount`, `isPublished`, `total`/`totalPages`). This left the Name/Teacher/Students
columns empty, totals at 0, and `aria-label="Actions for undefined"`.

**Fix:**
- Added `mapCourse()` in `courses.api.ts` to translate raw entities and flatten the
  meta-wrapped pagination response.
- Corrected `CourseStatus` to the real backend enum (`draft|published|archived`), removing
  the nonexistent `active`/`completed` values, and updated status badges/filters/labels +
  i18n accordingly.
- Fixed the archive/restore toggle, which previously sent an invalid `'active'` status.
- Locale-aware date formatting throughout.
- Commit `067a746`.

---

### 5.3 [HIGH] Teachers — non-existent endpoint, zero results, zero i18n

**Issue:** The page called a non-existent `/api/admin/teachers` endpoint, and even with a
correct endpoint the `{data, meta}` response shape didn't match the flat
`PaginatedResponse` type the page expected — the table always showed 0 teachers.

**Fix:**
- Added `RawTeacher`/`RawPaginatedResponse` + `mapTeacher()` to `teachers.api.ts`,
  flattening the `user` relation and mapping `user.status` → `TeacherStatus`.
- Rewrote `useAdminTeachers()` on `useTeacherList()` + a status-toggle mutation with
  query-key invalidation.
- Backend: `UpdateTeacherDto` had no `status` field (status lives on `User`, not
  `Teacher`), so the toggle failed `forbidNonWhitelisted` validation — added the field and
  wired `TeachersService.update()` to write it to the linked `User` record.
- Replaced all hardcoded strings with a uz/en/ru `I18N` dict, added KPI icons, and
  locale-aware dates.
- Frontend commit `745ac97`; backend commit `c01cdd9`.
- **This session:** added a server-component `page.tsx` shell + `AdminTeachersClient.tsx`
  so the route gets a localized `<title>` (see 5.11e).

---

### 5.4 [HIGH] Students — raw API shape, duplicate empty states, zero i18n

**Issue:** Same raw-response mismatch as Teachers, plus the page rendered **two** empty
states simultaneously (one from the KPI/filter bar, one from the table) whenever the list
was empty, and every string was hardcoded English.

**Fix:**
- Added `RawStudent`/`RawPaginatedResponse` + mapper mirroring the teachers fix; status
  (`active`/`inactive`/`suspended`/`graduated`) derived from the `user` relation and
  `graduationDate`.
- Rewrote `useAdminStudents` on `useStudentList` with a TanStack Query mutation for status
  toggles.
- Fixed the duplicate empty-state by gating the KPI/filter bars and table behind a single
  page-level `hasNoData` check.
- Backend: `UpdateStudentDto` got the same `status` field + `StudentsService.update()` fix
  as Teachers.
- Translated to uz/en/ru.
- Frontend commit `3b87e65`; backend commit `62255ef`.
- **This session:** added a server-component `page.tsx` shell + `AdminStudentsClient.tsx`
  for a localized `<title>` (see 5.11e).

---

### 5.5 [HIGH] Schedule — duplicate create-event forms, broken calendar query

**Issue:** The page rendered two separate "create event" forms (one page-level, one inside
`ScheduleCalendar`'s own `CreateEventForm`) causing a layout overlap and conflicting state.
`AdminScheduleClient` relied on an incomplete next-intl namespace (mixed translated/English
strings). On the backend, the calendar range query filtered on `schedule.date`, a column
that does not exist (the entity uses `specific_date`), and `CreateScheduleDto` required
`groupId` and rejected `isRecurring`, so the admin schedule form's payload always failed
validation.

**Fix:**
- Replaced the dual-form layout with a single `EventFormPanel` supporting both create and
  edit.
- Rewrote `useAdminSchedule`/`useAdminCourses`/`useAdminTeachers` on TanStack Query via a
  new `schedules.api.ts` mapper layer and a `queryKeys.schedules` factory namespace.
- Full uz/en/ru `I18N` dict with locale-aware `date-fns` formatting.
- Backend: `schedules.repository.ts` now queries `specific_date`; `CreateScheduleDto` makes
  `groupId` optional and allows `isRecurring`; `schedules.service.ts` derives the required
  `day_of_week` column from the supplied date on create/update.
- Frontend commit `8b384bd`; backend commit `a727493`.

---

### 5.6 [HIGH] Payments — pagination 422s, broken tab switching, zero i18n

**Issue:** `usePayments`/`payments.api` requested `limit: 200`, exceeding the backend's
`@Max(100)` constraint on `/payments` and `/courses` and causing 422 errors. The raw
`{data, meta}` envelope from `/payments` was never mapped into the flat
`PaginatedResponse` shape, leaving `total`/`page`/`limit`/`totalPages` `undefined`. The
Debts tab used a two-block `AnimatePresence` pattern that never rendered. All copy was
hardcoded English.

**Fix:**
- Capped pagination requests at the backend's `@Max(100)` limit.
- Mapped the `{data, meta}` envelope into the flat `PaginatedResponse` shape.
- Replaced the broken two-block `AnimatePresence` tab switch with a ternary render, fixing
  the Debts tab.
- Localized `AdminPaymentsClient` and `DebtCalculator` (uz/en/ru).
- Backend: `payments.repository.ts`'s `getDebtors()` raw SQL referenced unquoted
  `u.first_name`/`u.last_name` — `User.firstName`/`lastName` have no snake_case override,
  so the query threw `column does not exist`; quoted the camelCase identifiers and aligned
  `GROUP BY`.
- Commit `009b983` (frontend), `8d15114` (backend).

---

### 5.7 [HIGH] Reports — non-existent endpoints, dead export options

**Issue:** The page called `/api/admin/reports/recent` and
`POST /api/admin/reports/:type`, neither of which exist (both 404'd permanently). The UI
also offered PDF/Excel export options and a "Recent Reports" list that had no backing
implementation.

**Fix:**
- Replaced with the real backend endpoints
  (`/admin/reports/operational|attendance|debt|payments`) and generate CSV downloads
  client-side.
- Removed the dead PDF/Excel export options and "Recent Reports" list.
- Rewrote `ReportGenerator` and `AdminReportsClient` with full uz/en/ru i18n.
- Backend: `getOperationalReport` queried a non-existent `exam_results` table (now joins
  `exam_attempts` → `exams` for tenant scoping and uses the `score` column, not
  `total_score`); `getDebtReport`/`getPaymentMonitoring` had the same unquoted
  `firstName`/`lastName` bug as 5.6, fixed the same way.
- Frontend commit `c60d8a2`; backend commit `31b9879`.

---

### 5.8 [HIGH] Analytics — crash on load, raw `.trend` access, fake charts

**Issue:** The page crashed with *"Cannot read properties of undefined (reading 'trend')"*
because `AdminAnalyticsData` declared a `revenue`/`students`/`attendance` shape with
`trend` arrays the backend has never returned. The real response is
`{ revenueByMonth, enrollmentsByMonth, attendanceByMonth, avgAttendanceRate, totalRevenue,
totalEnrollments }`. The date-range filter was also a no-op — the backend always returned
the trailing 6 months regardless of `from`/`to`.

**Fix:**
- Retyped `AdminAnalyticsData` to match the real response and rewrote the client to render
  3 KPI cards + 3 monthly trend charts from real data.
- Dropped the payment-status pie chart and "Summary" panel, which depended on fields the
  endpoint never populates and contained a hardcoded English "Monthly Revenue" label
  regardless of locale.
- Backend: `GET /admin/analytics` now computes the bucket count from the requested
  `from`/`to` range (clamped 1–12 months) so the date-range filter actually changes the
  returned data.
- Frontend commit `ab0ece8`; backend commit `b29f580`.

---

### 5.9 [MEDIUM] Settings — General/Pricing/Notifications tabs unwired, zero i18n

**Issue:** The General, Pricing, and Notifications tabs called admin settings endpoints
that did not exist on the backend, so config always showed "No configuration found",
pricing was always empty, and Notifications was a fake local-state tab with a `setTimeout`
"save". `page.tsx`, `TenantConfigForm`, and `PricingManager` were all hardcoded English.

**Fix:**
- Backend: added `GET`/`PATCH /admin/settings/config` (backed by the `tenants` table),
  `GET`/`PATCH`/`DELETE /admin/settings/pricing(/:id)` (backed by `courses`), and
  `GET`/`PATCH /admin/settings/notifications` (backed by `tenants.settings` JSONB).
- Frontend: added `useAdminNotificationPreferences` against the new endpoints (proxied
  through the existing `/api/[...path]` catch-all route to the backend); translated
  `page.tsx`, `TenantConfigForm`, and `PricingManager` (uz/en/ru), including dynamic
  aria-labels and Russian course-count pluralization.
- Frontend commit `0f2a16c`; backend commit `39473b4`.
- **This session:** split the page into a server-component `page.tsx` shell +
  `AdminSettingsClient.tsx` for a localized `<title>` (see 5.11e); removed a stale
  comment claiming a separate `metadata.ts` had been created (it never was).

---

### 5.10 [MEDIUM] Profile — entirely hardcoded English, en-US-only date

**Issue:** `AdminProfileClient` hardcoded every string (header, role badge, tab labels,
account-info card, field labels) and formatted "Member Since" with `date-fns`'s
English-only `format()`.

**Fix:**
- Switched to next-intl's `profile` namespace (reusing `OwnerProfileClient`'s pattern) and
  `useLocale()` + `formatLocalizedDate()` for the member-since date.
- Added `adminRole`, `accountInfo`, `fullName`, `emailAddress`, and `sectionsAria` keys to
  the `profile` namespace in en/ru/uz.
- Live-verified across all 3 locales, including correctly localized dates ("April 8, 2026"
  / "8 апреля 2026" / "8-aprel, 2026").
- Commit `f4bc279`.

---

### 5.11 Cross-cutting findings

#### 5.11a [LOW] `errors.retry` MISSING_MESSAGE on every error state

**Issue:** `ErrorState`'s retry button called `t('retry')` from the `errors` namespace,
which had no such key in en/ru/uz — every admin page that rendered an error state logged a
`next-intl` `MISSING_MESSAGE` warning, masked by a try/catch fallback to the literal string
`"Retry"`.

**Fix:** Added `errors.retry` to en/ru/uz and removed the now-unnecessary try/catch
fallback in `EmptyState.tsx`'s `ErrorState`. Live-verified via console logs on the
dashboard — no warnings remain.

---

#### 5.11b [LOW] `/notifications/unread-count` 404 (mobile bottom-nav badge)

**Issue:** `MobileBottomNav`'s unread-count badge fetched a nonexistent Next.js route
(`/api/notifications/unread-count`), always failing and showing 0.

**Fix:**
- Backend: added `GET /notifications/unread-count` → `{ count }` via a lightweight
  `notifRepo.count()` query.
- Frontend: `MobileBottomNav` now reuses the existing `useUnreadNotificationCount()` hook
  (same as `NotificationBell`). Live-verified:
  `GET /api/v1/notifications/unread-count → 200 {"count": 0}`.
- Frontend commit `9c9f4c5`; backend commit `fa60ae5`.

---

#### 5.11c [LOW] Dead `analyticsApi` module

**Issue:** `src/services/api/analytics.api.ts` (159 lines) exported an `analyticsApi`
object with `getAdminAnalytics`/`getOwnerAnalytics`/`getCourseAnalytics`/etc., targeting
`/analytics/admin` and `/analytics/owner` — neither route exists on the backend. Confirmed
via grep: zero usages anywhere in `src/` (the real hooks are `useAdminAnalytics` /
`useOwnerAnalytics` in `admin.queries.ts` / `owner.queries.ts`, unrelated files).

**Fix:** Deleted the file. `tsc` passes with it removed.

---

#### 5.11d [LOW] Stray empty directory under `admin/`

**Issue:** `src/app/[locale]/(dashboard)/admin/{dashboard,teachers,students,schedule,
reports,analytics,settings}` existed as a literal directory name — almost certainly the
result of a `mkdir -p admin/{a,b,c}`-style brace expansion run in a shell that doesn't
support it (e.g. PowerShell). It was empty and untracked by git.

**Fix:** Removed.

---

#### 5.11e [LOW] `teachers`/`students`/`settings` pages missing `generateMetadata`

**Issue:** Of the 10 admin routes, `dashboard`, `courses`, `schedule`, `payments`,
`reports`, `analytics`, and `profile` all export `generateMetadata()` for a localized
`<title>` via either a server-shell `page.tsx` + client component, or
`getTranslations({locale, namespace: ...})`. `teachers/page.tsx`, `students/page.tsx`, and
`settings/page.tsx` were each a single `'use client'` file with the entire page in it —
`generateMetadata`/`generateStaticParams` cannot be exported from a `'use client'` module,
so these three routes had no per-route `<title>` (all showed the root layout's default
title).

**Fix:**
- Split each into a server-component `page.tsx` shell (exports `generateMetadata()` via
  `getTranslations({locale, namespace: 'admin'})` → `t('teachers.title')` /
  `t('students.title')` / `t('settings.title')`, calls `setRequestLocale`, and dynamically
  imports the client component) and a sibling `AdminTeachersClient.tsx` /
  `AdminStudentsClient.tsx` / `AdminSettingsClient.tsx` (unchanged page body, now exported
  as a named function instead of the page's default export).
- Live-verified `<title>` for all three routes:
  - `/en/admin/teachers` → `"Teachers | Admin — EduCRM"`
  - `/ru/admin/students` → `"Студенты | Admin — EduCRM"`
  - `/uz/admin/settings` → `"Sozlamalar | Admin — EduCRM"`
- Commit `190cd99` (same commit also removes 5.11c and 5.11d).

---

## Confirmed OK (no issues found)

The following were reviewed this session and found to be correctly implemented:

- **Sidebar** (`Sidebar.tsx`) and **Breadcrumb** (`Breadcrumb.tsx`) — both fully driven by
  `useTranslations('nav')`; the `nav` namespace has entries for every admin segment
  (`admin`, `dashboard`, `courses`, `teachers`, `students`, `schedule`, `payments`,
  `reports`, `analytics`, `settings`, `profile`) in en/ru/uz.
- **Schedule `repeatRule`/`isRecurring`** — fully implemented end-to-end: `RepeatRule` type
  and `repeatLabel()` rendering in `ScheduleCalendar.tsx`, form wiring in
  `AdminScheduleClient.tsx`, and backend persistence via `create-schedule.dto.ts` +
  `schedules.service.ts` (fixed under 5.5).
- **`@Max(100)` pagination limits** — `useAdmin.ts` hooks request `limit: 100` for
  courses/teachers/students, within the backend's bound (the `limit: 200` bug from 5.6 was
  specific to payments and has been fixed).
- **`payments.repository.ts getDebtors()`** — joins students/users/payments, filters
  `debt_amount > 0`, and groups correctly (fixed under 5.6).
- Skeleton loaders (`AdminDashboardSkeleton`, `AdminScheduleSkeleton`,
  `AdminPaymentDetailSkeleton`, `SkeletonLoader` variants used by Teachers/Students) are
  present and wired to each page's `isLoading` state.

---

## Recommendations (not blocking)

- **`useAdminSettings`/`useAdminNotificationPreferences`** (`useAdmin.ts`) still use raw
  `fetch()` + `useState`/`useEffect` against `/api/admin/settings/config|pricing|
  notifications`, rather than TanStack Query + `adminApi` like the other admin hooks. These
  calls **do work correctly** — they're served by the existing `/api/[...path]` catch-all
  proxy to the backend (live-verified: `GET /api/admin/settings/config → 200`,
  `GET /api/admin/settings/pricing → 200` on `/en/admin/settings`) — so this is a
  consistency/maintainability item, not a functional defect. A future pass could migrate
  these two hooks onto `adminApi` + TanStack Query for consistency with
  `useAdminTeachers`/`useAdminStudents`/`useAdminSchedule`.

---

## Verification

- All edited locale files (`en.json`, `ru.json`, `uz.json`) validated as well-formed JSON.
- `npx tsc --noEmit -p tsconfig.json` passes with 0 errors on both `edu-crm-fixed` and
  `edu-crm-backend` after every batch of changes, including the final state.
- ESLint run on all modified files; no new errors introduced (two pre-existing
  `react-hooks/exhaustive-deps` warnings in `AdminSettingsClient.tsx`, unrelated to this
  audit, were carried over unchanged from the prior `settings/page.tsx`).
- Live walkthrough of all 10 admin routes in uz/en/ru as `admin@gmail.com`:
  - Dashboard, Courses, Teachers, Students, Schedule, Payments, Reports, Analytics,
    Settings, Profile all render real data with no `MISSING_MESSAGE` warnings and no
    failed (4xx/5xx) API calls other than the expected pre-login 401s.
  - `/notifications/unread-count` → `200 {"count": 0}`.
  - Per-route `<title>` confirmed for Teachers (EN), Students (RU), and Settings (UZ).
