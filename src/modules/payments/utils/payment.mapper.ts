import { format } from 'date-fns';
import {
  PaymentDto,
  InvoiceDto,
  PaymentFormValues,
  PaymentDisplayItem,
  InvoiceFormValues,
  Currency,
  PaymentMethod,
} from '../types/payment.types';

export function mapPaymentDtoToForm(dto: PaymentDto): PaymentFormValues {
  return {
    studentId: dto.studentId,
    courseId: dto.courseId,
    amount: dto.amount,
    currency: dto.currency as Currency,
    method: dto.method as PaymentMethod,
    dueDate: dto.dueDate,
    ...(dto.notes ? { notes: dto.notes } : {}),
  };
}

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
    paidAt: dto.paidAt ? format(new Date(dto.paidAt), 'dd MMM yyyy HH:mm') : null,
  };
}

export function mapPaymentFormToDto(
  form: PaymentFormValues
): Omit<PaymentDto, 'id' | 'studentName' | 'studentEmail' | 'courseName' | 'createdAt' | 'updatedAt' | 'paidAt'> {
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

export function mapInvoiceFormToDto(
  form: InvoiceFormValues
): Omit<InvoiceDto, 'id' | 'studentName' | 'studentEmail' | 'courseName' | 'history' | 'paidAt' | 'createdAt'> {
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
  }).format(amount);
}
