'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/utils/cn';
import type { PricingEntry } from '../types/admin.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PricingManagerProps {
  entries: PricingEntry[];
  currencies: string[];
  onUpdatePrice: (id: string, price: number, currency: string) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

// ─── Inline edit row state ────────────────────────────────────────────────────

interface EditState {
  price: string;
  currency: string;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center px-4 py-12 text-center"
    >
      <span className="text-4xl" aria-hidden="true">🏷️</span>
      <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
        No pricing entries yet
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Add courses to configure their pricing.
      </p>
    </motion.div>
  );
}

// ─── Desktop table row ────────────────────────────────────────────────────────

interface DesktopRowProps {
  entry: PricingEntry;
  currencies: string[];
  isEditing: boolean;
  isSaving: boolean;
  editState: EditState;
  onEditChange: (field: keyof EditState, value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  index: number;
}

function DesktopRow({
  entry,
  currencies,
  isEditing,
  isSaving,
  editState,
  onEditChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  index,
}: DesktopRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
      className={cn(
        'transition-colors',
        isEditing
          ? 'bg-[var(--bg-surface-secondary)]'
          : 'hover:bg-[var(--bg-surface-hover)]',
      )}
    >
      {/* Course name */}
      <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
        {entry.courseName}
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit-price"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <input
                id={`price-${entry.id}`}
                type="number"
                inputMode="numeric"
                value={editState.price}
                onChange={(e) => onEditChange('price', e.target.value)}
                className={cn(
                  'w-32 rounded-lg border bg-[var(--bg-surface)] px-2.5 py-1.5',
                  'text-sm text-[var(--text-primary)] tabular-nums',
                  'border-[var(--border-default)]',
                  'focus:border-[var(--border-focus)] focus:outline-none',
                  'focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-1',
                  'transition-[border-color,box-shadow]',
                )}
                min="0"
                aria-label={`Price for ${entry.courseName}`}
              />
            </motion.div>
          ) : (
            <motion.span
              key="view-price"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm tabular-nums text-[var(--text-primary)]"
            >
              {entry.price.toLocaleString()}
            </motion.span>
          )}
        </AnimatePresence>
      </td>

      {/* Currency */}
      <td className="px-4 py-3">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit-currency"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <select
                id={`currency-${entry.id}`}
                value={editState.currency}
                onChange={(e) => onEditChange('currency', e.target.value)}
                className={cn(
                  'rounded-lg border bg-[var(--bg-surface)] px-2.5 py-1.5',
                  'text-sm text-[var(--text-primary)]',
                  'border-[var(--border-default)]',
                  'focus:border-[var(--border-focus)] focus:outline-none',
                  'focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-1',
                  'transition-[border-color,box-shadow]',
                )}
                aria-label={`Currency for ${entry.courseName}`}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </motion.div>
          ) : (
            <motion.span
              key="view-currency"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-[var(--text-secondary)]"
            >
              {entry.currency}
            </motion.span>
          )}
        </AnimatePresence>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editing-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <motion.button
                  onClick={onSave}
                  disabled={isSaving}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'min-h-[32px] rounded-lg px-3 py-1 text-xs font-medium',
                    'bg-[var(--success-solid)] text-white',
                    'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
                    'transition-opacity',
                  )}
                  type="button"
                  aria-label={`Save changes for ${entry.courseName}`}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
                        aria-hidden="true"
                      />
                      Saving…
                    </span>
                  ) : (
                    'Save'
                  )}
                </motion.button>
                <motion.button
                  onClick={onCancel}
                  disabled={isSaving}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'min-h-[32px] rounded-lg px-3 py-1 text-xs font-medium',
                    'text-[var(--text-secondary)]',
                    'hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
                    'disabled:opacity-50 transition-colors',
                  )}
                  type="button"
                  aria-label="Cancel editing"
                >
                  Cancel
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="view-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <motion.button
                  onClick={onStartEdit}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'min-h-[32px] rounded-lg px-3 py-1 text-xs font-medium',
                    'text-[var(--brand-primary)]',
                    'hover:bg-[var(--bg-surface-hover)]',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
                    'transition-colors',
                  )}
                  type="button"
                  aria-label={`Edit price for ${entry.courseName}`}
                >
                  Edit
                </motion.button>
                <motion.button
                  onClick={onDelete}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'min-h-[32px] rounded-lg px-3 py-1 text-xs font-medium',
                    'text-[var(--error-solid)]',
                    'hover:bg-[var(--error-bg)]',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--error-solid)] focus-visible:ring-offset-1',
                    'transition-colors',
                  )}
                  type="button"
                  aria-label={`Delete pricing for ${entry.courseName}`}
                >
                  Delete
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

interface MobileCardProps {
  entry: PricingEntry;
  currencies: string[];
  isEditing: boolean;
  isSaving: boolean;
  editState: EditState;
  onEditChange: (field: keyof EditState, value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  index: number;
}

function MobileCard({
  entry,
  currencies,
  isEditing,
  isSaving,
  editState,
  onEditChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  index,
}: MobileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
      className={cn(
        'rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4',
        isEditing && 'ring-2 ring-[var(--border-focus)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {entry.courseName}
          </p>
          {!isEditing && (
            <p className="mt-1 text-sm tabular-nums text-[var(--text-secondary)]">
              {entry.price.toLocaleString()}{' '}
              <span className="font-medium text-[var(--text-muted)]">
                {entry.currency}
              </span>
            </p>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 gap-2">
            <motion.button
              onClick={onStartEdit}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-xs font-medium',
                'border border-[var(--border-default)] text-[var(--brand-primary)]',
                'hover:bg-[var(--bg-surface-hover)]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--border-focus)]',
                'transition-colors',
              )}
              type="button"
              aria-label={`Edit price for ${entry.courseName}`}
            >
              Edit
            </motion.button>
            <motion.button
              onClick={onDelete}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-xs font-medium',
                'border border-[var(--error-border)] text-[var(--error-solid)]',
                'hover:bg-[var(--error-bg)]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--error-solid)]',
                'transition-colors',
              )}
              type="button"
              aria-label={`Delete pricing for ${entry.courseName}`}
            >
              Delete
            </motion.button>
          </div>
        )}
      </div>

      {/* Inline edit fields on mobile */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            <div className="space-y-1.5">
              <label
                htmlFor={`mobile-price-${entry.id}`}
                className="text-xs font-medium text-[var(--text-muted)]"
              >
                Price
              </label>
              <input
                id={`mobile-price-${entry.id}`}
                type="number"
                inputMode="numeric"
                value={editState.price}
                onChange={(e) => onEditChange('price', e.target.value)}
                className={cn(
                  'w-full rounded-lg border bg-[var(--bg-surface)] px-3 py-2.5',
                  'text-sm text-[var(--text-primary)] tabular-nums',
                  'border-[var(--border-default)]',
                  'focus:border-[var(--border-focus)] focus:outline-none',
                  'focus:ring-2 focus:ring-[var(--border-focus)]',
                  'min-h-[44px] transition-[border-color,box-shadow]',
                )}
                min="0"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`mobile-currency-${entry.id}`}
                className="text-xs font-medium text-[var(--text-muted)]"
              >
                Currency
              </label>
              <select
                id={`mobile-currency-${entry.id}`}
                value={editState.currency}
                onChange={(e) => onEditChange('currency', e.target.value)}
                className={cn(
                  'w-full rounded-lg border bg-[var(--bg-surface)] px-3 py-2.5',
                  'text-sm text-[var(--text-primary)]',
                  'border-[var(--border-default)]',
                  'focus:border-[var(--border-focus)] focus:outline-none',
                  'focus:ring-2 focus:ring-[var(--border-focus)]',
                  'min-h-[44px] transition-[border-color,box-shadow]',
                )}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <motion.button
                onClick={onSave}
                disabled={isSaving}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex-1 min-h-[44px] rounded-lg px-4 py-2.5 text-sm font-medium',
                  'bg-[var(--success-solid)] text-white',
                  'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--border-focus)]',
                  'transition-opacity',
                )}
                type="button"
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </motion.button>
              <motion.button
                onClick={onCancel}
                disabled={isSaving}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'min-h-[44px] rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium',
                  'text-[var(--text-secondary)]',
                  'hover:bg-[var(--bg-surface-hover)]',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--border-focus)]',
                  'disabled:opacity-50 transition-colors',
                )}
                type="button"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PricingManager ───────────────────────────────────────────────────────────

export function PricingManager({
  entries,
  currencies,
  onUpdatePrice,
  onDeleteEntry,
}: PricingManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    price: '',
    currency: '',
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (entry: PricingEntry) => {
    setEditingId(entry.id);
    setEditState({
      price: String(entry.price),
      currency: entry.currency,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState({ price: '', currency: '' });
  };

  const handleEditChange = (field: keyof EditState, value: string) => {
    setEditState((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    try {
      await onUpdatePrice(id, Number(editState.price), editState.currency);
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
      role="region"
      aria-label="Course pricing management"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Course Pricing
        </h3>
        <span className="rounded-full bg-[var(--bg-surface-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">
          {entries.length} {entries.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Desktop table (md+) ─────────────────────────────────────── */}
          <div className="hidden md:block">
            <table className="w-full text-sm" aria-label="Course pricing table">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
                  {['Course', 'Price', 'Currency', 'Actions'].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {entries.map((entry, index) => (
                  <DesktopRow
                    key={entry.id}
                    entry={entry}
                    currencies={currencies}
                    isEditing={editingId === entry.id}
                    isSaving={savingId === entry.id}
                    editState={editState}
                    onEditChange={handleEditChange}
                    onStartEdit={() => startEdit(entry)}
                    onSave={() => void saveEdit(entry.id)}
                    onCancel={cancelEdit}
                    onDelete={() => void onDeleteEntry(entry.id)}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile card list (< md) ─────────────────────────────────── */}
          <div className="space-y-3 p-4 md:hidden">
            {entries.map((entry, index) => (
              <MobileCard
                key={entry.id}
                entry={entry}
                currencies={currencies}
                isEditing={editingId === entry.id}
                isSaving={savingId === entry.id}
                editState={editState}
                onEditChange={handleEditChange}
                onStartEdit={() => startEdit(entry)}
                onSave={() => void saveEdit(entry.id)}
                onCancel={cancelEdit}
                onDelete={() => void onDeleteEntry(entry.id)}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
