'use client';

import { useState, type ReactNode } from 'react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { X, SlidersHorizontal } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date-range' | 'radio';
  options?: FilterOption[];
}

interface MobileFilterSheetProps {
  filters: FilterConfig[];
  activeFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
  onClear: () => void;
  trigger?: ReactNode;
}

// ─── Filter Section ───────────────────────────────────────────────────────────

interface FilterSectionProps {
  config: FilterConfig;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

function FilterSection({ config, value, onChange }: FilterSectionProps) {
  const { key, label, type, options = [] } = config;

  return (
    <section style={{ marginBottom: 24 }}>
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </p>

      {/* Select / Radio */}
      {(type === 'select' || type === 'radio') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(key, isSelected ? undefined : opt.value)}
                aria-pressed={isSelected}
                style={{
                  width: '100%',
                  minHeight: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 14px',
                  border: `1.5px solid ${
                    isSelected ? 'var(--brand-primary)' : 'var(--border-default)'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)'
                    : 'transparent',
                  color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                  fontSize: 15,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{opt.label}</span>
                {type === 'radio' && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${
                        isSelected ? 'var(--brand-primary)' : 'var(--border-strong)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: 'var(--brand-primary)',
                        }}
                      />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Multiselect */}
      {type === 'multiselect' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map((opt) => {
            const selected = Array.isArray(value)
              ? (value as string[]).includes(opt.value)
              : false;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  const current = Array.isArray(value) ? (value as string[]) : [];
                  const next = selected
                    ? current.filter((v) => v !== opt.value)
                    : [...current, opt.value];
                  onChange(key, next.length > 0 ? next : undefined);
                }}
                aria-pressed={selected}
                style={{
                  padding: '8px 16px',
                  minHeight: 44,
                  border: `1.5px solid ${
                    selected ? 'var(--brand-primary)' : 'var(--border-default)'
                  }`,
                  borderRadius: 'var(--radius-full)',
                  background: selected ? 'var(--brand-primary)' : 'transparent',
                  color: selected ? 'var(--text-on-brand)' : 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: selected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Date range */}
      {type === 'date-range' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {(['from', 'to'] as const).map((part) => {
            const rangeValue = (value as Record<string, string> | undefined) ?? {};
            return (
              <div key={part} style={{ flex: 1 }}>
                <label
                  htmlFor={`filter-${key}-${part}`}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {part === 'from' ? 'From' : 'To'}
                </label>
                <input
                  id={`filter-${key}-${part}`}
                  type="date"
                  value={rangeValue[part] ?? ''}
                  onChange={(e) => {
                    onChange(key, { ...rangeValue, [part]: e.target.value });
                  }}
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 10px',
                    border: '1.5px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Active filter chips ──────────────────────────────────────────────────────

interface ActiveChipsProps {
  filters: FilterConfig[];
  activeFilters: Record<string, unknown>;
  onRemove: (key: string) => void;
}

function ActiveChips({ filters, activeFilters, onRemove }: ActiveChipsProps) {
  const chips: Array<{ key: string; label: string }> = [];

  for (const config of filters) {
    const val = activeFilters[config.key];
    if (!val) continue;

    if (Array.isArray(val)) {
      const opts = config.options ?? [];
      (val as string[]).forEach((v) => {
        const found = opts.find((o) => o.value === v);
        if (found) chips.push({ key: config.key, label: `${config.label}: ${found.label}` });
      });
    } else if (typeof val === 'string') {
      const found = config.options?.find((o) => o.value === val);
      if (found) chips.push({ key: config.key, label: `${config.label}: ${found.label}` });
    } else if (typeof val === 'object') {
      chips.push({ key: config.key, label: config.label });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 12px' }}
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            color: 'var(--brand-primary)',
            fontWeight: 500,
          }}
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              color: 'inherit',
              minWidth: 20,
              minHeight: 20,
            }}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileFilterSheet({
  filters,
  activeFilters,
  onApply,
  onClear,
  trigger,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(activeFilters);

  function handleOpen() {
    setDraft(activeFilters);
    setOpen(true);
  }

  function handleApply() {
    // Strip undefined / null / empty array values
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(draft)) {
      if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)) {
        cleaned[k] = v;
      }
    }
    onApply(cleaned);
    setOpen(false);
  }

  function handleClear() {
    setDraft({});
    onClear();
    setOpen(false);
  }

  function handleChange(key: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleRemoveActive(key: string) {
    const next = { ...activeFilters };
    delete next[key];
    onApply(next);
  }

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <>
      {/* Trigger */}
      <div onClick={handleOpen} style={{ display: 'inline-flex' }}>
        {trigger ?? (
          <button
            aria-label={`Filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: '0 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: `1.5px solid ${
                activeCount > 0 ? 'var(--brand-primary)' : 'var(--border-default)'
              }`,
              borderRadius: 'var(--radius-md)',
              background:
                activeCount > 0
                  ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)'
                  : 'transparent',
              color: activeCount > 0 ? 'var(--brand-primary)' : 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--brand-primary)',
                  color: 'var(--text-on-brand)',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Active chips — rendered inline outside the sheet */}
      <ActiveChips
        filters={filters}
        activeFilters={activeFilters}
        onRemove={handleRemoveActive}
      />

      {/* Bottom sheet */}
      <MobileBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        snapPoints={[0.7, 0.92]}
      >
        {/* Filter sections */}
        <div style={{ padding: '8px 16px 120px' }}>
          {filters.map((config) => (
            <FilterSection
              key={config.key}
              config={config}
              value={draft[config.key]}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* Sticky footer */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-default)',
            padding: '12px 16px',
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            onClick={handleClear}
            style={{
              minHeight: 48,
              padding: '0 20px',
              background: 'none',
              border: '1.5px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Clear all
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 1,
              minHeight: 48,
              background: 'var(--brand-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-on-brand)',
              cursor: 'pointer',
            }}
          >
            Apply filters
          </button>
        </div>
      </MobileBottomSheet>
    </>
  );
}
