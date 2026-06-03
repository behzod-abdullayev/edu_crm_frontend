'use client';

import { useState } from 'react';
import { PricingEntry } from '../types/admin.types';

interface PricingManagerProps {
  entries: PricingEntry[];
  currencies: string[];
  onUpdatePrice: (id: string, price: number, currency: string) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

export function PricingManager({
  entries,
  currencies,
  onUpdatePrice,
  onDeleteEntry,
}: PricingManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (entry: PricingEntry) => {
    setEditingId(entry.id);
    setEditPrice(String(entry.price));
    setEditCurrency(entry.currency);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
    setEditCurrency('');
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    try {
      await onUpdatePrice(id, Number(editPrice), editCurrency);
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Course Pricing</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Course
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Currency
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => {
            const isEditing = editingId === entry.id;
            return (
              <tr key={entry.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{entry.courseName}</td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      min="0"
                    />
                  ) : (
                    <span className="tabular-nums">{entry.price.toLocaleString()}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <select
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {currencies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{entry.currency}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(entry.id)}
                          disabled={savingId === entry.id}
                          className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50 dark:text-green-400"
                          type="button"
                        >
                          {savingId === entry.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs font-medium text-muted-foreground hover:underline"
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(entry)}
                          className="text-xs text-primary hover:underline"
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="text-xs text-red-600 hover:underline dark:text-red-400"
                          type="button"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
