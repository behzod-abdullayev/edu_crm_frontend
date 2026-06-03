/** A value that can also be null */
export type Nullable<T> = T | null;

/** A value that can also be undefined */
export type Optional<T> = T | undefined;

/** Opaque string ID type */
export type ID = string;

/** ISO 8601 timestamp string */
export type Timestamp = string;

/** Entity status */
export type Status = 'active' | 'inactive' | 'pending' | 'blocked';

/** Platform user roles */
export type UserRole = 'student' | 'teacher' | 'admin' | 'owner';

/** Supported locales */
export type Locale = 'uz' | 'en' | 'ru';

/** Sort direction */
export type SortOrder = 'ASC' | 'DESC';

/** UI color theme */
export type Theme = 'light' | 'dark' | 'system';

/** Generic key-value record */
export type StringRecord = Record<string, string>;

/** Generic key-value record with unknown values */
export type AnyRecord = Record<string, unknown>;

/** Deeply readonly version of T */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/** Make specific keys of T required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make specific keys of T optional */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Extract the element type from an array */
export type ElementOf<T extends readonly unknown[]> = T[number];

/** Utility to get all values of an object type */
export type ValueOf<T> = T[keyof T];
