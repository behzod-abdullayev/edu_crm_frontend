'use client';

/**
 * src/shared/components/forms/RichTextEditor.tsx
 *
 * Lightweight contentEditable rich text editor.
 *
 * ⚠️  Lazy-load this component to keep bundle size small:
 *   const RichTextEditor = dynamic(
 *     () => import('@shared/components/forms/RichTextEditor').then(m => ({ default: m.RichTextEditor })),
 *     { ssr: false }
 *   );
 *
 * Features:
 * ✅ Toolbar: Bold, Italic, Underline, Bullet list, Ordered list, Link
 * ✅ onMouseDown prevents focus loss before exec
 * ✅ Correct CSS variables from globals.css (no --color-* aliases)
 * ✅ WCAG 2.1 AA: role="toolbar", aria-controls, aria-label, focus-visible ring
 * ✅ Placeholder via CSS attr() — no JS dependency
 * ✅ No "any" TypeScript types
 * ✅ next-intl translations (all strings externalised)
 * ✅ Disabled state
 */

import { useRef, useCallback, useId } from 'react';
import { useTranslations } from 'next-intl';
import { Bold, Italic, Underline, List, ListOrdered, Link } from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  /** Current HTML value */
  value: string;
  /** Called with innerHTML on every change */
  onChange: (html: string) => void;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Disables all interaction */
  disabled?: boolean;
  /** Additional Tailwind classes on the wrapper */
  className?: string;
}

type ExecCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'createLink';

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  command?: ExecCommand;
  action?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
}: RichTextEditorProps) {
  const t = useTranslations('editor');
  const editorId = useId();
  const editorRef = useRef<HTMLDivElement>(null);

  // Execute a document command without losing editor focus
  const exec = useCallback(
    (command: ExecCommand, val?: string) => {
      document.execCommand(command, false, val ?? undefined);
      editorRef.current?.focus();
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange],
  );

  const handleLink = useCallback(() => {
    const url = window.prompt(t('enterUrl'));
    if (url) exec('createLink', url);
  }, [exec, t]);

  const toolbarButtons: ToolbarButton[] = [
    { icon: Bold,         label: t('bold'),         command: 'bold' },
    { icon: Italic,       label: t('italic'),       command: 'italic' },
    { icon: Underline,    label: t('underline'),     command: 'underline' },
    { icon: List,         label: t('bulletList'),    command: 'insertUnorderedList' },
    { icon: ListOrdered,  label: t('orderedList'),   command: 'insertOrderedList' },
    { icon: Link,         label: t('link'),          action: handleLink },
  ];

  const resolvedPlaceholder = placeholder ?? t('startTyping');

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[var(--border-default)]',
        'bg-[var(--bg-surface)]',
        'focus-within:ring-2 focus-within:ring-[var(--border-focus)] focus-within:border-[var(--border-focus)]',
        'transition-[box-shadow,border-color] duration-[var(--transition-fast)]',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {/* ── Toolbar ── */}
      <div
        role="toolbar"
        aria-label={t('toolbar')}
        aria-controls={editorId}
        className={cn(
          'flex items-center gap-0.5 px-2 py-1.5',
          'border-b border-[var(--border-default)]',
          'bg-[var(--bg-surface-secondary)]',
        )}
      >
        {toolbarButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              type="button"
              aria-label={btn.label}
              disabled={disabled}
              onMouseDown={(e) => {
                // Prevent blur before execCommand
                e.preventDefault();
                if (btn.action !== undefined) {
                  btn.action();
                } else if (btn.command !== undefined) {
                  exec(btn.command);
                }
              }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                'text-[var(--text-secondary)]',
                'hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
                'transition-colors duration-[var(--transition-fast)]',
                'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* ── Editable area ── */}
      <div
        id={editorId}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={resolvedPlaceholder}
        aria-disabled={disabled}
        contentEditable={!disabled}
        suppressContentEditableWarning
        /* eslint-disable-next-line react/no-danger */
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        data-placeholder={resolvedPlaceholder}
        className={cn(
          'min-h-[140px] p-4',
          'text-sm leading-relaxed text-[var(--text-primary)]',
          'outline-none',
          // Prose-like link styling without @tailwindcss/typography plugin
          '[&_a]:text-[var(--brand-primary)] [&_a]:underline',
          '[&_ul]:list-disc [&_ul]:pl-5',
          '[&_ol]:list-decimal [&_ol]:pl-5',
          // Placeholder via CSS attr()
          '[&:empty]:before:content-[attr(data-placeholder)]',
          '[&:empty]:before:text-[var(--text-muted)]',
          '[&:empty]:before:pointer-events-none',
        )}
      />
    </div>
  );
}