/**
 * @file src/modules/payments/mappers/payment.mapper.ts
 *
 * Payment module mapper — DTO ↔ UI form value transformations.
 *
 * All types come from '../types/payment.types' (module-level types).
 * The tests in src/__tests__/unit/mappers/payment.mapper.test.ts import
 * mapPaymentDtoToForm, mapPaymentFormToDto, mapInvoiceDtoToDisplay, and
 * mapInvoiceFormToDto by name — their signatures must not change.
 *
 * Design rules (from the project prompt):
 *   - Pure functions only — no side effects, no API calls.
 *   - Fully typed — no `any`, no unsafe casts.
 *   - Under `exactOptionalPropertyTypes: true`, optional keys are OMITTED
 *     when absent, not set to `undefined`.
 *   - Unit-tested in src/__tests__/unit/mappers/payment.mapper.test.ts.
 */

import { format } from 'date-fns';
import {
  type PaymentDto,
  type InvoiceDto,
  type PaymentFormValues,
  type PaymentDisplayItem,
  type InvoiceFormValues,
  type Currency,
  type PaymentMethod,
  type PaymentStatus,
  type DebtSummary,
} from '../types/payment.types';

// ─── PaymentDto ↔ PaymentFormValues ──────────────────────────────────────────

/**
 * Maps a full PaymentDto (from GET /payments/:id) to the form shape used by
 * the payment create / edit form (PaymentFormValues).
 *
 * Only the fields the form manages are mapped; read-only fields
 * (id, studentName, createdAt, …) are discarded.
 *
 * Under exactOptionalPropertyTypes: notes is included only when it has an
 * actual string value — null and undefined both result in the key being
 * omitted from the returned object.
 */
export function mapPaymentDtoToForm(dto: PaymentDto): PaymentFormValues {
  return {
    studentId: dto.studentId,
    courseId: dto.courseId,
    amount: dto.amount,
    currency: dto.currency as Currency,
    method: dto.method as PaymentMethod,
    dueDate: dto.dueDate,
    ...(dto.notes !== null && dto.notes !== undefined ? { notes: dto.notes } : {}),
  };
}

/**
 * Maps validated PaymentFormValues to the partial PaymentDto shape sent to
 * POST /payments (or used as a PATCH body).
 *
 * The returned type omits all read-only / server-computed fields so the caller
 * can pass it directly to the API without further transformation.
 *
 * notes is set to null (not omitted) when absent so the backend can
 * distinguish "clear the note" from "don't touch the note".
 */
export function mapPaymentFormToDto(
  form: PaymentFormValues,
): Omit<
  PaymentDto,
  'id' | 'studentName' | 'studentEmail' | 'courseName' | 'createdAt' | 'updatedAt' | 'paidAt'
> {
  return {
    studentId: form.studentId,
    courseId: form.courseId,
    amount: form.amount,
    currency: form.currency,
    method: form.method,
    status: 'pending',
    dueDate: form.dueDate,
    notes: form.notes ?? null,
  };
}

// ─── InvoiceDto → PaymentDisplayItem ─────────────────────────────────────────

/**
 * Converts a full InvoiceDto to the flat PaymentDisplayItem shape used by
 * InvoiceList and the admin payments tables.
 *
 * `amount` is formatted as a localised currency string via formatAmount().
 * Dates are formatted as "dd MMM yyyy"; paidAt additionally includes HH:mm.
 * paidAt is null when the invoice has not been settled.
 */
export function mapInvoiceDtoToDisplay(dto: InvoiceDto): PaymentDisplayItem {
  return {
    id: dto.id,
    studentName: dto.studentName,
    studentEmail: dto.studentEmail,
    courseName: dto.courseName,
    amount: formatAmount(dto.amount, dto.currency),
    currency: dto.currency,
    status: dto.status,
    dueDate: format(new Date(dto.dueDate), 'dd MMM yyyy'),
    paidAt:
      dto.paidAt !== null && dto.paidAt !== undefined
        ? format(new Date(dto.paidAt), 'dd MMM yyyy HH:mm')
        : null,
  };
}

// ─── InvoiceFormValues ↔ InvoiceDto (write payload) ──────────────────────────

/**
 * Maps validated InvoiceFormValues to the write payload for
 * POST /payments/invoices or PATCH /payments/invoices/:id.
 *
 * Omits all read-only / server-computed fields (id, studentName,
 * studentEmail, courseName, history, paidAt, createdAt).
 *
 * description is set to null when absent so the backend can treat an
 * explicit null as "clear the description" rather than "no change".
 * discount defaults to 0 when not provided.
 */
export function mapInvoiceFormToDto(
  form: InvoiceFormValues,
): Omit<
  InvoiceDto,
  'id' | 'studentName' | 'studentEmail' | 'courseName' | 'history' | 'paidAt' | 'createdAt'
> {
  return {
    studentId: form.studentId,
    courseId: form.courseId,
    amount: form.amount,
    currency: form.currency,
    status: 'pending',
    dueDate: form.dueDate,
    description: form.description ?? null,
    discount: form.discount ?? 0,
  };
}

// ─── DebtSummary helpers ──────────────────────────────────────────────────────

/**
 * Returns a human-readable formatted amount string from a DebtSummary.
 * Used by the DebtCalculator component to display the total owed.
 */
export function formatDebtAmount(debt: DebtSummary): string {
  return formatAmount(debt.totalOwed, debt.currency);
}

// ─── Derived status helpers ───────────────────────────────────────────────────

/**
 * Returns true when a payment is still actionable — can be paid or cancelled.
 */
export function isPaymentActionable(status: PaymentStatus): boolean {
  return status === 'pending' || status === 'overdue';
}

/**
 * Returns true when a payment is in a terminal state where no further
 * mutations are expected from the UI.
 */
export function isPaymentTerminal(status: PaymentStatus): boolean {
  return status === 'paid' || status === 'refunded' || status === 'cancelled';
}

/**
 * Sums amounts for a filtered subset of PaymentDto rows by status.
 * Returns 0 when the filtered array is empty.
 */
export function sumPaymentsByStatus(
  payments: PaymentDto[],
  status: PaymentStatus,
): number {
  return payments
    .filter((p) => p.status === status)
    .reduce((acc, p) => acc + p.amount, 0);
}

// ─── Private formatting helper ────────────────────────────────────────────────

/**
 * Formats a numeric amount as a locale-appropriate currency string.
 *
 * UZS → 0 decimal places (tiyin not used in practice)
 * USD, EUR, RUB → 2 decimal places
 */
function formatAmount(amount: number, currency: Currency): string {
  const localeMap: Record<Currency, string> = {
    UZS: 'uz-UZ',
    USD: 'en-US',
    EUR: 'de-DE',
    RUB: 'ru-RU',
  };

  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'UZS' ? 0 : 2,
    maximumFractionDigits: currency === 'UZS' ? 0 : 2,
  }).format(amount);
}