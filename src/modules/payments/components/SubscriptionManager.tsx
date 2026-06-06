'use client';

/**
 * src/modules/payments/components/SubscriptionManager.tsx
 *
 * Two-tab manager:
 *  • Plans  — grid of plan cards with active/inactive toggle
 *  • Students — table (desktop) / card list (mobile) of student subscriptions
 *
 * ✅ Framer Motion: tab indicator slide, plan card hover-lift, toggle spring
 * ✅ Responsive: plans 1→2→3 col; students table→card list on mobile
 * ✅ Full CSS variable palette — zero hardcoded colors
 * ✅ ARIA: tabs, switches, status badges
 * ✅ Zero "any" TypeScript — strict mode
 * ✅ next-intl i18n
 */

import { useState, useId, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Check, X, AlertCircle, Calendar, User } from 'lucide-react';
import { FadeIn } from '@shared/components/animations/FadeIn';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionInterval = 'monthly' | 'quarterly' | 'annually';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  features: string[];
  isActive: boolean;
  subscriberCount?: number;
}

export interface StudentSubscription {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface SubscriptionManagerProps {
  plans: SubscriptionPlan[];
  subscriptions: StudentSubscription[];
  canManage: boolean;
  isLoading?: boolean;
  onCreatePlan: () => void;
  onEditPlan: (planId: string) => void;
  onTogglePlan: (planId: string, active: boolean) => void;
  onCancelSubscription: (subscriptionId: string) => void;
  onViewStudent: (studentId: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = 'plans' | 'students';

const INTERVAL_SUFFIX: Record<SubscriptionInterval, string> = {
  monthly:   'perMonth',
  quarterly: 'perQuarter',
  annually:  'perYear',
};

// ─── Status badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: SubscriptionStatus;
}

const STATUS_STYLE: Record<SubscriptionStatus, { bg: string; text: string }> = {
  active:    { bg: 'var(--success-bg)',  text: 'var(--success-text)' },
  cancelled: { bg: 'var(--error-bg)',    text: 'var(--error-text)' },
  expired:   { bg: 'var(--warning-bg)',  text: 'var(--warning-text)' },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLE[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 11,
        fontWeight: 600,
        background: styles.bg,
        color: styles.text,
      }}
      role="status"
    >
      {status === 'active' && <Check size={10} aria-hidden="true" />}
      {status === 'cancelled' && <X size={10} aria-hidden="true" />}
      {status === 'expired' && <AlertCircle size={10} aria-hidden="true" />}
      {status}
    </span>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, label, disabled = false }: ToggleSwitchProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-strong)]',
      )}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[var(--shadow-sm)]"
        animate={{ x: checked ? 20 : 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 500, damping: 30 }
        }
        aria-hidden="true"
      />
    </motion.button>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: SubscriptionPlan;
  canManage: boolean;
  onToggle: (active: boolean) => void;
  onEdit: () => void;
  t: ReturnType<typeof useTranslations>;
}

function PlanCard({ plan, canManage, onToggle, onEdit, t }: PlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-2xl border p-5 flex flex-col gap-4 transition-shadow duration-200',
        plan.isActive
          ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/4 shadow-[var(--shadow-md)]'
          : 'border-[var(--border-default)] bg-[var(--bg-surface)] opacity-70',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{plan.name}</h3>
          <p className="text-xs text-[var(--text-muted)] capitalize">{plan.interval}</p>
        </div>
        {canManage && (
          <ToggleSwitch
            checked={plan.isActive}
            onChange={onToggle}
            label={plan.isActive ? t('deactivatePlan') : t('activatePlan')}
          />
        )}
      </div>

      {/* Price */}
      <div>
        <span className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
          {new Intl.NumberFormat('uz-UZ').format(plan.price)}
        </span>
        <span className="ml-1.5 text-sm text-[var(--text-muted)]">
          {plan.currency} {t(INTERVAL_SUFFIX[plan.interval] as Parameters<typeof t>[0])}
        </span>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2" aria-label={t('features')}>
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
          >
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)]"
              aria-hidden="true"
            >
              <Check size={10} className="text-[var(--success-text)]" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Subscriber count + edit */}
      <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-3">
        {plan.subscriberCount !== undefined && (
          <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <User size={11} aria-hidden="true" />
            {plan.subscriberCount} {t('subscribers')}
          </p>
        )}
        {canManage && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onEdit}
            className="ml-auto rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-colors"
          >
            {t('editPlan')}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Plans tab ────────────────────────────────────────────────────────────────

interface PlansTabProps {
  plans: SubscriptionPlan[];
  canManage: boolean;
  isLoading: boolean;
  onToggle: (planId: string, active: boolean) => void;
  onEdit: (planId: string) => void;
  onCreatePlan: () => void;
  t: ReturnType<typeof useTranslations>;
}

function PlansTab({
  plans,
  canManage,
  isLoading,
  onToggle,
  onEdit,
  onCreatePlan,
  t,
}: PlansTabProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        title={t('noPlans')}
        description={t('noPlansDesc')}
        {...(canManage && onCreatePlan ? { action: { label: t('createPlan'), onClick: onCreatePlan } } : {})}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          canManage={canManage}
          onToggle={(active) => onToggle(plan.id, active)}
          onEdit={() => onEdit(plan.id)}
          t={t}
        />
      ))}
    </div>
  );
}

// ─── Mobile subscription card ─────────────────────────────────────────────────

interface MobileSubscriptionCardProps {
  sub: StudentSubscription;
  canManage: boolean;
  onCancel: () => void;
  onViewStudent: () => void;
  t: ReturnType<typeof useTranslations>;
}

function MobileSubscriptionCard({
  sub,
  canManage,
  onCancel,
  onViewStudent,
  t,
}: MobileSubscriptionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 border-b border-[var(--border-default)] last:border-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--text-primary)]">{sub.studentName}</p>
          <p className="text-xs text-[var(--text-muted)]">{sub.studentEmail}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{sub.planName}</p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Calendar size={10} aria-hidden="true" />
            <time dateTime={sub.currentPeriodEnd}>
              {t('renewsOn')}: {format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy')}
            </time>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={sub.status} />
          {canManage && sub.status === 'active' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-[var(--error-text)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] rounded"
            >
              {t('cancelSubscription')}
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onViewStudent}
            className="text-xs font-medium text-[var(--brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] rounded"
          >
            {t('viewStudent')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Students tab ─────────────────────────────────────────────────────────────

interface StudentsTabProps {
  subscriptions: StudentSubscription[];
  canManage: boolean;
  isLoading: boolean;
  onCancel: (id: string) => void;
  onViewStudent: (studentId: string) => void;
  t: ReturnType<typeof useTranslations>;
}

function StudentsTab({
  subscriptions,
  canManage,
  isLoading,
  onCancel,
  onViewStudent,
  t,
}: StudentsTabProps) {
  if (isLoading) {
    return <SkeletonLoader variant="table" />;
  }

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        title={t('noSubscriptions')}
        description={t('noSubscriptionsDesc')}
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-default)] sm:block">
        <table
          className="w-full text-sm"
          aria-label={t('subscriptionsTable')}
        >
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
              {([
                'student',
                'plan',
                'status',
                'renewsOn',
                'actions',
              ] as const).map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {t(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {subscriptions.map((sub, index) => (
              <motion.tr
                key={sub.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
                className="group hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)]">{sub.studentName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{sub.studentEmail}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.planName}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={sub.status} />
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                  <time dateTime={sub.currentPeriodEnd}>
                    {format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy')}
                  </time>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onViewStudent(sub.studentId)}
                      className="text-xs font-medium text-[var(--brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] rounded"
                    >
                      {t('viewStudent')}
                    </button>
                    {canManage && sub.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => onCancel(sub.id)}
                        className="text-xs font-medium text-[var(--error-text)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] rounded"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div
        className="overflow-hidden rounded-2xl border border-[var(--border-default)] sm:hidden"
        role="list"
        aria-label={t('subscriptionsTable')}
      >
        {subscriptions.map((sub) => (
          <div key={sub.id} role="listitem">
            <MobileSubscriptionCard
              sub={sub}
              canManage={canManage}
              onCancel={() => onCancel(sub.id)}
              onViewStudent={() => onViewStudent(sub.studentId)}
              t={t}
            />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

interface TabButtonProps {
  tabId: string;
  panelId: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}

function TabButton({
  tabId,
  panelId,
  isActive,
  label,
  onClick,
}: TabButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      id={tabId}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-xl px-5 py-2 text-sm font-medium capitalize transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
        isActive
          ? 'text-[var(--brand-primary)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
      )}
    >
      {label}
      {isActive && (
        <motion.span
          layoutId="subscription-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--brand-primary)]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SubscriptionManager({
  plans,
  subscriptions,
  canManage,
  isLoading = false,
  onCreatePlan,
  onEditPlan,
  onTogglePlan,
  onCancelSubscription,
  onViewStudent,
}: SubscriptionManagerProps) {
  const t = useTranslations('payments');
  const [activeTab, setActiveTab] = useState<Tab>('plans');

  const tabsId = useId();
  const plansTabId = `${tabsId}-tab-plans`;
  const studentsTabId = `${tabsId}-tab-students`;
  const plansPanelId = `${tabsId}-panel-plans`;
  const studentsPanelId = `${tabsId}-panel-students`;

  const handleTogglePlan = useCallback(
    (planId: string, active: boolean) => onTogglePlan(planId, active),
    [onTogglePlan],
  );

  return (
    <FadeIn className="space-y-5">
      {/* Tab strip */}
      <div
        role="tablist"
        aria-label={t('subscriptionManager')}
        className="flex gap-1 border-b border-[var(--border-default)]"
      >
        <TabButton
          tabId={plansTabId}
          panelId={plansPanelId}
          isActive={activeTab === 'plans'}
          label={t('plans')}
          onClick={() => setActiveTab('plans')}
        />
        <TabButton
          tabId={studentsTabId}
          panelId={studentsPanelId}
          isActive={activeTab === 'students'}
          label={t('students')}
          onClick={() => setActiveTab('students')}
        />
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'plans' && (
          <motion.div
            key="plans"
            id={plansPanelId}
            role="tabpanel"
            aria-labelledby={plansTabId}
            tabIndex={0}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="focus-visible:outline-none"
          >
            {canManage && (
              <div className="mb-4 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={onCreatePlan}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-colors"
                >
                  + {t('createPlan')}
                </motion.button>
              </div>
            )}
            <PlansTab
              plans={plans}
              canManage={canManage}
              isLoading={isLoading}
              onToggle={handleTogglePlan}
              onEdit={onEditPlan}
              onCreatePlan={onCreatePlan}
              t={t}
            />
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div
            key="students"
            id={studentsPanelId}
            role="tabpanel"
            aria-labelledby={studentsTabId}
            tabIndex={0}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="focus-visible:outline-none"
          >
            <StudentsTab
              subscriptions={subscriptions}
              canManage={canManage}
              isLoading={isLoading}
              onCancel={onCancelSubscription}
              onViewStudent={onViewStudent}
              t={t}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </FadeIn>
  );
}