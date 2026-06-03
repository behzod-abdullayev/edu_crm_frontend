'use client';

import { useState } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'quarterly' | 'annually';
  features: string[];
  isActive: boolean;
}

interface StudentSubscription {
  studentId: string;
  studentName: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string;
}

interface SubscriptionManagerProps {
  plans: SubscriptionPlan[];
  subscriptions: StudentSubscription[];
  onCreatePlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  onTogglePlan: (planId: string, active: boolean) => void;
  onCancelSubscription: (studentId: string) => void;
}

const INTERVAL_LABELS: Record<SubscriptionPlan['interval'], string> = {
  monthly: 'per month',
  quarterly: 'per quarter',
  annually: 'per year',
};

export function SubscriptionManager({
  plans,
  subscriptions,
  onCreatePlan,
  onTogglePlan,
  onCancelSubscription,
}: SubscriptionManagerProps) {
  const [activeTab, setActiveTab] = useState<'plans' | 'students'>('plans');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['plans', 'students'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={[
                'rounded-xl border p-5 transition-all',
                plan.isActive
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-card opacity-60',
              ].join(' ')}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{plan.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {plan.interval}
                  </p>
                </div>
                <button
                  onClick={() => onTogglePlan(plan.id, !plan.isActive)}
                  className={[
                    'relative h-5 w-9 rounded-full transition-colors',
                    plan.isActive ? 'bg-primary' : 'bg-muted',
                  ].join(' ')}
                  type="button"
                  role="switch"
                  aria-checked={plan.isActive}
                >
                  <span
                    className={[
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                      plan.isActive ? 'translate-x-4' : 'translate-x-0.5',
                    ].join(' ')}
                  />
                </button>
              </div>

              <p className="mb-4 text-2xl font-bold tabular-nums text-foreground">
                {plan.price.toLocaleString()}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.currency} {INTERVAL_LABELS[plan.interval]}
                </span>
              </p>

              <ul className="space-y-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Student', 'Plan', 'Status', 'Renews', 'Actions'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((sub) => (
                <tr key={sub.studentId} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{sub.studentName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.planName}</td>
                  <td className="px-4 py-3">
                    <span className={[
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      sub.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      sub.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-muted text-muted-foreground',
                    ].join(' ')}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {sub.status === 'active' && (
                      <button
                        onClick={() => onCancelSubscription(sub.studentId)}
                        className="text-xs text-red-600 hover:underline dark:text-red-400"
                        type="button"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
