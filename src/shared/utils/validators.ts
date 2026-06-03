import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const emailSchema = z
  .string({ required_error: 'validation.required' })
  .min(1, 'validation.required')
  .email('validation.invalidEmail')
  .max(254, 'validation.emailTooLong');

export const passwordSchema = z
  .string({ required_error: 'validation.required' })
  .min(MIN_PASSWORD_LENGTH, 'validation.passwordTooShort')
  .max(128, 'validation.passwordTooLong')
  .regex(/[A-Z]/, 'validation.passwordNeedsUppercase')
  .regex(/[a-z]/, 'validation.passwordNeedsLowercase')
  .regex(/[0-9]/, 'validation.passwordNeedsNumber');

export const phoneSchema = z
  .string({ required_error: 'validation.required' })
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'validation.invalidPhone');

export const uzPhoneSchema = z
  .string({ required_error: 'validation.required' })
  .regex(
    /^(\+998|998)?[0-9]{9}$/,
    'validation.invalidUzPhone',
  );

export const nameSchema = z
  .string({ required_error: 'validation.required' })
  .min(1, 'validation.required')
  .max(100, 'validation.nameTooLong')
  .regex(/^[\p{L}\s'\-]+$/u, 'validation.invalidName');

export const urlSchema = z
  .string()
  .url('validation.invalidUrl')
  .optional()
  .or(z.literal(''));

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const fileSchema = z
  .instanceof(File, { message: 'validation.invalidFile' })
  .refine(
    (f) => f.size <= MAX_FILE_SIZE_BYTES,
    `validation.fileTooLarge`,
  )
  .refine(
    (f) => [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ].includes(f.type),
    'validation.invalidFileType',
  );

export const imageFileSchema = z
  .instanceof(File, { message: 'validation.invalidFile' })
  .refine((f) => f.size <= MAX_FILE_SIZE_BYTES, 'validation.fileTooLarge')
  .refine(
    (f) => ALLOWED_IMAGE_TYPES.includes(f.type),
    'validation.invalidImageType',
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.required'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'validation.passwordsDoNotMatch',
    path: ['passwordConfirm'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;


/**
 * A required non-empty string schema.
 * @example requiredStringSchema.parse('hello') → 'hello'
 */
export const requiredStringSchema = z.string().min(1, 'This field is required');
