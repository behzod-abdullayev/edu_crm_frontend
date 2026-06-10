/**
 * Owner Branches Page
 * Route: /[locale]/(dashboard)/owner/branches
 *
 * FIXES (PDF xatolar):
 * ✅ XATO 1  — 'use client' olib tashlandi → generateMetadata() Server Component sifatida
 * ✅ XATO 2  — editBranch PATCH → POST /owner/branches (backend faqat POST qabul qiladi)
 * ✅ XATO 3  — deactivateBranch local state update (backend DTO isActive qabul qilmaydi)
 * ✅ XATO 4  — useOwnerBranches TanStack Query bilan qayta yozildi
 * ✅ XATO 5  — BranchManager.tsx inline form uchun RHF + Zod ishlatiladi
 * ✅ XATO 6  — Barcha hardcoded matnlar t() orqali
 * ✅ XATO 7  — text-white → text-[var(--text-on-brand)]
 * ✅ XATO 8  — Mobile KPI grid-cols-2 → grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
 * ✅ XATO 9  — Column sorting (asc/desc + animated arrow indicator)
 * ✅ XATO 10 — Multi-row checkbox selection + bulk actions toolbar
 * ✅ XATO 11 — Column visibility toggle
 * ✅ XATO 12 — CSV/Excel export
 * ✅ XATO 13 — DeactivateDialog mobile bottom sheet (items-end sm:items-center)
 * ✅ XATO 14 — Focus trap + body scroll lock on modals
 * ✅ XATO 15 — t('editShort') (alohida translation key, replace() yo'q)
 * ✅ XATO 16 — Smart pagination (ellipsis, sliding window, 6+ pages)
 * ✅ XATO 17 — SwipeableCard + PullToRefresh mobile kart uchun
 */

import { type Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import BranchesClient from './BranchesClient';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';

// ─── Metadata (Server Component) ─────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('owner.branches');
  return {
    title: `${t('title')} | EduCRM`,
    robots: { index: false, follow: false },
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BranchesSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">
        <SkeletonLoader variant="table" />
      </div>
    </div>
  );
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default function OwnerBranchesPage() {
  return (
    <Suspense fallback={<BranchesSkeleton />}>
      <BranchesClient />
    </Suspense>
  );
}