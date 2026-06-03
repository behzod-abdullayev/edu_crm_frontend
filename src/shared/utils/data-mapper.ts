import { parseISO, isValid } from 'date-fns';

/**
 * Remove all null and undefined values from an object (shallow).
 */
export function omitNullish<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

/**
 * Pick specific keys from an object.
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
}

/**
 * Omit specific keys from an object.
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const keySet = new Set(keys as string[]);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keySet.has(k)),
  ) as Omit<T, K>;
}

/**
 * Convert specified string fields to Date objects.
 * Invalid or missing values are left as-is.
 */
export function transformDates<T extends Record<string, unknown>>(
  obj: T,
  dateFields: (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of dateFields) {
    const value = result[field];
    if (typeof value === 'string') {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        (result as Record<string, unknown>)[field as string] = parsed;
      }
    }
  }
  return result;
}

/**
 * Recursively remove undefined values (useful before sending to API).
 */
export function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    ) as T;
  }
  return obj;
}

/**
 * Group an array of objects by a key's value.
 */
export function groupBy<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T,
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}
