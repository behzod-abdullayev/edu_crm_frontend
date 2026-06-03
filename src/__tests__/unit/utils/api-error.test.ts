import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';
import {
  parseApiError,
  mapApiErrorsToForm,
} from '@/shared/utils/api-error';

// Helper to create a mock AxiosError
function makeAxiosError(
  status: number,
  data: unknown,
  message = 'Request failed'
): AxiosError {
  const error = new AxiosError(message);
  Object.defineProperty(error, 'response', {
    value: {
      status,
      data,
      headers: {},
      config: {} as never,
      statusText: String(status),
    },
    writable: true,
  });
  return error;
}

describe('parseApiError', () => {
  describe('AxiosError handling', () => {
    it('extracts message from response data.message', () => {
      const err = makeAxiosError(400, { message: 'Invalid input' });
      expect(parseApiError(err).message).toBe('Invalid input');
    });

    it('extracts statusCode from response status', () => {
      const err = makeAxiosError(422, { message: 'Validation failed' });
      expect(parseApiError(err).statusCode).toBe(422);
    });

    it('extracts field errors from response data.errors object', () => {
      const err = makeAxiosError(422, {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: {
          email: ['Invalid email format'],
          phone: ['Phone is required'],
        },
      });
      const result = parseApiError(err);
      expect(result.errors).toBeDefined();
      expect(result.errors['email']).toEqual(['Invalid email format']);
      expect(result.errors['phone']).toEqual(['Phone is required']);
    });

    it('returns empty errors object when no field errors in response', () => {
      const err = makeAxiosError(422, {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      });
      const result = parseApiError(err);
      expect(result.errors).toEqual({});
    });

    it('returns 401 statusCode for unauthorized errors', () => {
      const err = makeAxiosError(401, { message: 'Unauthorized' });
      expect(parseApiError(err).statusCode).toBe(401);
    });

    it('returns 500 statusCode for server errors', () => {
      const err = makeAxiosError(500, { message: 'Internal server error' });
      expect(parseApiError(err).statusCode).toBe(500);
    });

    it('handles AxiosError with no response (network error)', () => {
      const err = new AxiosError('Network Error');
      const result = parseApiError(err);
      expect(result.message).toBeTruthy();
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('handles AxiosError with response but no data', () => {
      const err = makeAxiosError(503, null);
      const result = parseApiError(err);
      expect(result.message).toBeTruthy();
      expect(result.statusCode).toBe(503);
    });
  });

  describe('plain Error handling', () => {
    it('uses error.message for plain Error', () => {
      const err = new Error('Something broke');
      expect(parseApiError(err).message).toBe('Something broke');
    });

    it('returns code CLIENT_ERROR for plain Error', () => {
      const err = new Error('Something broke');
      expect(parseApiError(err).code).toBe('CLIENT_ERROR');
    });

    it('handles Error with empty message', () => {
      const err = new Error('');
      const result = parseApiError(err);
      expect(typeof result.message).toBe('string');
    });
  });

  describe('unknown / string error handling', () => {
    it('handles string error', () => {
      const result = parseApiError('Something went wrong');
      expect(result.message).toBeTruthy();
    });

    it('handles null', () => {
      const result = parseApiError(null);
      expect(result.message).toBeTruthy();
    });

    it('handles undefined', () => {
      const result = parseApiError(undefined);
      expect(result.message).toBeTruthy();
    });

    it('handles number', () => {
      const result = parseApiError(42);
      expect(result.message).toBeTruthy();
    });

    it('handles object without message', () => {
      const result = parseApiError({ code: 'ERR_UNKNOWN' });
      expect(result.message).toBeTruthy();
    });
  });
});

describe('mapApiErrorsToForm', () => {
  const mockSetError = vi.fn();

  beforeEach(() => {
    mockSetError.mockClear();
  });

  it('calls setError for each field error', () => {
    const apiError = {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: {
        email: ['Invalid email'],
        password: ['Too short'],
      },
    };
    mapApiErrorsToForm(apiError, mockSetError);
    expect(mockSetError).toHaveBeenCalledTimes(2);
  });

  it('calls setError with correct field name and message', () => {
    const apiError = {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: { email: ['Invalid email format'] },
    };
    mapApiErrorsToForm(apiError, mockSetError);
    expect(mockSetError).toHaveBeenCalledWith(
      'email',
      expect.objectContaining({ message: 'Invalid email format' }),
    );
  });

  it('handles nested paths like address.city', () => {
    const apiError = {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: { 'address.city': ['City is required'] },
    };
    mapApiErrorsToForm(apiError, mockSetError);
    expect(mockSetError).toHaveBeenCalledWith(
      'address.city',
      expect.objectContaining({ message: 'City is required' }),
    );
  });

  it('handles array paths like items.0.price', () => {
    const apiError = {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: { 'items.0.price': ['Price must be positive'] },
    };
    mapApiErrorsToForm(apiError, mockSetError);
    expect(mockSetError).toHaveBeenCalledWith(
      'items.0.price',
      expect.objectContaining({ message: 'Price must be positive' }),
    );
  });

  it('does not call setError when errors object is empty', () => {
    const apiError = {
      statusCode: 400,
      message: 'Bad request',
      code: 'BAD_REQUEST',
      errors: {},
    };
    mapApiErrorsToForm(apiError, mockSetError);
    expect(mockSetError).not.toHaveBeenCalled();
  });

  it('uses first message from array of field errors', () => {
    const apiError = {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: { email: ['Must be valid email', 'Must not be empty'] },
    };
    mapApiErrorsToForm(apiError, mockSetError);
    expect(mockSetError).toHaveBeenCalledWith(
      'email',
      expect.objectContaining({ message: 'Must be valid email' }),
    );
  });
});