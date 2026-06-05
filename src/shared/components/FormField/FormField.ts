/**
 * @module FormField
 * Barrel export for the FormField component.
 *
 * Import from this barrel in all module-level code:
 *   import { FormField } from '@shared/components/FormField/FormField';
 *
 * The real implementation lives in:
 *   src/shared/components/forms/FormField.tsx
 *
 * FormField wraps any form control (input, select, textarea, custom picker)
 * and provides:
 *   – Accessible label with optional "required" marker
 *   – Animated inline error message (Framer Motion, respects prefers-reduced-motion)
 *   – Optional helper/description text linked via aria-describedby
 *   – Consistent spacing and typography tokens from the design system
 *
 * Usage:
 *   <FormField label="Email address" required error={errors.email?.message}>
 *     <input id="email" type="email" {...register('email')} />
 *   </FormField>
 */

export { FormField } from '../forms/FormField';