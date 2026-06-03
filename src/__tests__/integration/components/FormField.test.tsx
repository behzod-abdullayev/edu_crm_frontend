import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
// Correct import: barrel re-exports from forms/FormField
import { FormField } from '@/shared/components/FormField/FormField';

expect.extend(toHaveNoViolations);

// FormField props:
//   label: string
//   error?: string
//   required?: boolean
//   description?: string    ← was wrongly called "helperText" in old tests
//   children: ReactNode
//   htmlFor?: string
//   className?: string

describe('FormField', () => {

  // ─── Label rendering ───────────────────────────────────────────────────────

  describe('label rendering', () => {
    it('renders label text', () => {
      render(
        <FormField label="Email Address" htmlFor="email">
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('renders required asterisk when required prop is true', () => {
      render(
        <FormField label="Email Address" htmlFor="email" required>
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does NOT render asterisk when required is false', () => {
      render(
        <FormField label="Email Address" htmlFor="email" required={false}>
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('does NOT render asterisk when required is not provided', () => {
      render(
        <FormField label="Email Address" htmlFor="email">
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('renders children inside FormField', () => {
      render(
        <FormField label="Name" htmlFor="name">
          <input id="name" data-testid="child-input" />
        </FormField>
      );
      expect(screen.getByTestId('child-input')).toBeInTheDocument();
    });
  });

  // ─── Error message ─────────────────────────────────────────────────────────

  describe('error message', () => {
    it('renders error message when error prop is set', () => {
      render(
        <FormField label="Email" htmlFor="email" error="Invalid email format">
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('does NOT render error message when error is not provided', () => {
      render(
        <FormField label="Email" htmlFor="email">
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does NOT render error when error is empty string', () => {
      render(
        <FormField label="Email" htmlFor="email" error="">
          <input id="email" type="email" />
        </FormField>
      );
      // Empty string error should not render a visible error element
      const alerts = screen.queryAllByRole('alert');
      const visibleAlert = alerts.find((el) => el.textContent?.trim() !== '');
      expect(visibleAlert).toBeUndefined();
    });

    it('error message has alert role or is linked via aria-describedby', () => {
      render(
        <FormField label="Email" htmlFor="email" error="Required field">
          <input id="email" type="email" />
        </FormField>
      );
      // Either role="alert" on error element, or aria-describedby on the input
      const hasAlert = screen.queryByRole('alert') !== null;
      const input = screen.getByLabelText(/email/i);
      const hasAriaDescribedby = input.hasAttribute('aria-describedby');
      expect(hasAlert || hasAriaDescribedby).toBe(true);
    });
  });

  // ─── Description / helper text ─────────────────────────────────────────────
  // FormField uses `description` prop (NOT `helperText`)

  describe('description (helper text)', () => {
    it('renders description text when description prop is provided', () => {
      render(
        <FormField label="Email" htmlFor="email" description="We'll never share your email.">
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.getByText("We'll never share your email.")).toBeInTheDocument();
    });

    it('does NOT render description when not provided', () => {
      render(
        <FormField label="Email" htmlFor="email">
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.queryByText(/never share/i)).not.toBeInTheDocument();
    });

    it('renders both description and error simultaneously', () => {
      render(
        <FormField
          label="Email"
          htmlFor="email"
          description="Enter a valid address."
          error="Email is required"
        >
          <input id="email" type="email" />
        </FormField>
      );
      expect(screen.getByText('Enter a valid address.')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  // ─── htmlFor / label association ───────────────────────────────────────────

  describe('label-input association', () => {
    it('label is associated with input via htmlFor', () => {
      render(
        <FormField label="Username" htmlFor="username">
          <input id="username" type="text" />
        </FormField>
      );
      // getByLabelText throws if association is broken
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('passes axe check with no error', async () => {
      const { container } = render(
        <FormField label="Email Address" htmlFor="email">
          <input id="email" type="email" />
        </FormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check with required field', async () => {
      const { container } = render(
        <FormField label="Email Address" htmlFor="email" required>
          <input id="email" type="email" required />
        </FormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check with error message', async () => {
      const { container } = render(
        <FormField label="Email Address" htmlFor="email" error="Invalid email">
          <input id="email" type="email" aria-invalid="true" />
        </FormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check with description', async () => {
      const { container } = render(
        <FormField
          label="Email Address"
          htmlFor="email"
          description="Enter your work email"
        >
          <input id="email" type="email" />
        </FormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});