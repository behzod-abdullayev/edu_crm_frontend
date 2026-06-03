import { describe, it, expect } from 'vitest';
import {
  mapPaymentDtoToForm,
  mapPaymentFormToDto,
  mapInvoiceDtoToDisplay,
  mapInvoiceFormToDto,
} from '@/modules/payments/mappers/payment.mapper';
import type {
  PaymentDto,
  InvoiceDto,
  PaymentFormValues,
  InvoiceFormValues,
} from '@/modules/payments/types/payment.types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockPaymentDto: PaymentDto = {
  id: 'payment-1',
  studentId: 'student-1',
  studentName: 'Aziz Karimov',
  studentEmail: 'aziz@example.com',
  courseId: 'course-1',
  courseName: 'Advanced Math',
  amount: 750_000,
  currency: 'UZS',
  method: 'cash',
  status: 'paid',
  dueDate: '2024-03-31',
  paidAt: '2024-03-10T10:30:00Z',
  notes: 'March tuition fee',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-10T10:30:00Z',
};

const mockPaymentDtoNulls: PaymentDto = {
  id: 'payment-2',
  studentId: 'student-2',
  studentName: 'Kamola Yusupova',
  studentEmail: 'kamola@example.com',
  courseId: 'course-2',
  courseName: 'English A1',
  amount: 500_000,
  currency: 'UZS',
  method: 'card',
  status: 'pending',
  dueDate: '2024-04-30',
  paidAt: null,
  notes: null,
  createdAt: '2024-04-01T00:00:00Z',
  updatedAt: '2024-04-01T00:00:00Z',
};

const mockInvoiceDto: InvoiceDto = {
  id: 'invoice-1',
  studentId: 'student-1',
  studentName: 'Aziz Karimov',
  studentEmail: 'aziz@example.com',
  courseId: 'course-1',
  courseName: 'Advanced Math',
  amount: 750_000,
  currency: 'UZS',
  status: 'pending',
  dueDate: '2024-03-31',
  paidAt: null,
  description: 'March tuition fee',
  discount: 0,
  history: [],
  createdAt: '2024-03-01T00:00:00Z',
};

const mockPaymentForm: PaymentFormValues = {
  studentId: 'student-1',
  courseId: 'course-1',
  amount: 750_000,
  currency: 'UZS',
  method: 'cash',
  dueDate: '2024-03-31',
  notes: 'March tuition fee',
};

const mockInvoiceForm: InvoiceFormValues = {
  studentId: 'student-1',
  courseId: 'course-1',
  amount: 750_000,
  currency: 'UZS',
  dueDate: '2024-03-31',
  description: 'March tuition fee',
  discount: 0,
};

// ─── mapPaymentDtoToForm ──────────────────────────────────────────────────────

describe('mapPaymentDtoToForm', () => {
  it('maps studentId correctly', () => {
    expect(mapPaymentDtoToForm(mockPaymentDto).studentId).toBe('student-1');
  });

  it('maps courseId correctly', () => {
    expect(mapPaymentDtoToForm(mockPaymentDto).courseId).toBe('course-1');
  });

  it('maps amount correctly', () => {
    expect(mapPaymentDtoToForm(mockPaymentDto).amount).toBe(750_000);
  });

  it('maps currency correctly', () => {
    expect(mapPaymentDtoToForm(mockPaymentDto).currency).toBe('UZS');
  });

  it('maps method correctly', () => {
    expect(mapPaymentDtoToForm(mockPaymentDto).method).toBe('cash');
  });

  it('maps dueDate correctly', () => {
    expect(mapPaymentDtoToForm(mockPaymentDto).dueDate).toBe('2024-03-31');
  });

  it('maps notes when present', () => {
    const result = mapPaymentDtoToForm(mockPaymentDto);
    expect(result.notes).toBe('March tuition fee');
  });

  it('omits notes when null', () => {
    const result = mapPaymentDtoToForm(mockPaymentDtoNulls);
    expect(result.notes == null || result.notes === '').toBe(true);
  });

  it('returns all required PaymentFormValues fields', () => {
    const result = mapPaymentDtoToForm(mockPaymentDto);
    expect(result.studentId).toBeDefined();
    expect(result.courseId).toBeDefined();
    expect(result.amount).toBeDefined();
    expect(result.currency).toBeDefined();
    expect(result.method).toBeDefined();
    expect(result.dueDate).toBeDefined();
  });
});

// ─── mapPaymentFormToDto ──────────────────────────────────────────────────────

describe('mapPaymentFormToDto', () => {
  it('maps studentId to DTO correctly', () => {
    expect(mapPaymentFormToDto(mockPaymentForm).studentId).toBe('student-1');
  });

  it('maps courseId to DTO correctly', () => {
    expect(mapPaymentFormToDto(mockPaymentForm).courseId).toBe('course-1');
  });

  it('maps amount to DTO correctly', () => {
    expect(mapPaymentFormToDto(mockPaymentForm).amount).toBe(750_000);
  });

  it('maps currency to DTO correctly', () => {
    expect(mapPaymentFormToDto(mockPaymentForm).currency).toBe('UZS');
  });

  it('maps method to DTO correctly', () => {
    expect(mapPaymentFormToDto(mockPaymentForm).method).toBe('cash');
  });

  it('sets status to pending by default', () => {
    expect(mapPaymentFormToDto(mockPaymentForm).status).toBe('pending');
  });

  it('maps notes to null when omitted', () => {
    const { notes: _omitted, ...rest } = mockPaymentForm;
    const form: PaymentFormValues = rest;
    const dto = mapPaymentFormToDto(form);
    expect(dto.notes).toBeNull();
  });

  it('maps notes when provided', () => {
    const dto = mapPaymentFormToDto(mockPaymentForm);
    expect(dto.notes).toBe('March tuition fee');
  });

  it('includes all required DTO fields', () => {
    const dto = mapPaymentFormToDto(mockPaymentForm);
    expect(dto.studentId).toBeDefined();
    expect(dto.courseId).toBeDefined();
    expect(dto.amount).toBeDefined();
    expect(dto.currency).toBeDefined();
    expect(dto.method).toBeDefined();
    expect(dto.status).toBeDefined();
    expect(dto.dueDate).toBeDefined();
  });
});

// ─── mapInvoiceDtoToDisplay ──────────────────────────────────────────────────

describe('mapInvoiceDtoToDisplay', () => {
  it('maps id correctly', () => {
    expect(mapInvoiceDtoToDisplay(mockInvoiceDto).id).toBe('invoice-1');
  });

  it('maps studentName correctly', () => {
    expect(mapInvoiceDtoToDisplay(mockInvoiceDto).studentName).toBe('Aziz Karimov');
  });

  it('maps studentEmail correctly', () => {
    expect(mapInvoiceDtoToDisplay(mockInvoiceDto).studentEmail).toBe('aziz@example.com');
  });

  it('maps courseName correctly', () => {
    expect(mapInvoiceDtoToDisplay(mockInvoiceDto).courseName).toBe('Advanced Math');
  });

  it('returns amount as a formatted string', () => {
    const result = mapInvoiceDtoToDisplay(mockInvoiceDto);
    expect(typeof result.amount).toBe('string');
    expect(result.amount.length).toBeGreaterThan(0);
  });

  it('maps currency correctly', () => {
    expect(mapInvoiceDtoToDisplay(mockInvoiceDto).currency).toBe('UZS');
  });

  it('maps status correctly', () => {
    expect(mapInvoiceDtoToDisplay(mockInvoiceDto).status).toBe('pending');
  });

  it('formats dueDate as a non-empty string', () => {
    const result = mapInvoiceDtoToDisplay(mockInvoiceDto);
    expect(typeof result.dueDate).toBe('string');
    expect(result.dueDate.length).toBeGreaterThan(0);
  });

  it('maps paidAt as null when null', () => {
    expect(mapInvoiceDtoToDisplay(mockInvoiceDto).paidAt).toBeNull();
  });

  it('maps paidAt as formatted string when present', () => {
    const paidInvoice: InvoiceDto = {
      ...mockInvoiceDto,
      paidAt: '2024-03-10T10:30:00Z',
    };
    const result = mapInvoiceDtoToDisplay(paidInvoice);
    expect(typeof result.paidAt).toBe('string');
    expect((result.paidAt ?? '').length).toBeGreaterThan(0);
  });
});

// ─── mapInvoiceFormToDto ─────────────────────────────────────────────────────

describe('mapInvoiceFormToDto', () => {
  it('maps studentId correctly', () => {
    expect(mapInvoiceFormToDto(mockInvoiceForm).studentId).toBe('student-1');
  });

  it('maps courseId correctly', () => {
    expect(mapInvoiceFormToDto(mockInvoiceForm).courseId).toBe('course-1');
  });

  it('maps amount correctly', () => {
    expect(mapInvoiceFormToDto(mockInvoiceForm).amount).toBe(750_000);
  });

  it('sets status to pending by default', () => {
    expect(mapInvoiceFormToDto(mockInvoiceForm).status).toBe('pending');
  });

  it('maps description when provided', () => {
    expect(mapInvoiceFormToDto(mockInvoiceForm).description).toBe('March tuition fee');
  });

  it('maps description to null when omitted', () => {
    const { description: _omitted, ...rest } = mockInvoiceForm;
    const form: InvoiceFormValues = rest;
    expect(mapInvoiceFormToDto(form).description).toBeNull();
  });

  it('maps discount when provided', () => {
    const form: InvoiceFormValues = { ...mockInvoiceForm, discount: 50_000 };
    expect(mapInvoiceFormToDto(form).discount).toBe(50_000);
  });

  it('defaults discount to 0 when omitted', () => {
    const { discount: _omitted, ...rest } = mockInvoiceForm;
    const form: InvoiceFormValues = rest;
    expect(mapInvoiceFormToDto(form).discount).toBe(0);
  });
});