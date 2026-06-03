import { isAxiosError } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  errors: Record<string, string[]>;
  details?: unknown;
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'message' in value &&
    'code' in value
  );
}

export function parseApiError(error: unknown): ApiError {
  // Already an ApiError shape (mapped by axios interceptor)
  if (isApiError(error)) return error;

  if (isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return {
      statusCode: error.response?.status ?? 0,
      message:
        typeof data?.message === 'string' ? data.message : error.message,
      code: typeof data?.code === 'string' ? data.code : 'NETWORK_ERROR',
      errors:
        data?.errors != null &&
        typeof data.errors === 'object' &&
        !Array.isArray(data.errors)
          ? (data.errors as Record<string, string[]>)
          : {},
      details: data?.details,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 0,
      message: error.message,
      code: 'CLIENT_ERROR',
      errors: {},
    };
  }

  return {
    statusCode: 0,
    message: 'errors.unknown',
    code: 'UNKNOWN_ERROR',
    errors: {},
  };
}

/**
 * Map API field errors to React Hook Form setError calls.
 *
 * Handles nested paths: 'address.city' → setError('address.city', ...)
 * Handles array paths: 'items.0.price' → setError('items.0.price', ...)
 */
export function mapApiErrorsToForm<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
): void {
  const fieldErrors = error.errors;

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const message = Array.isArray(messages) ? messages[0] : String(messages);

    // Dot-notation path is used directly by RHF — supports nested and array paths
    setError(field as Path<T>, {
      type: 'server',
      message: message ?? '',
    });
  }
}
