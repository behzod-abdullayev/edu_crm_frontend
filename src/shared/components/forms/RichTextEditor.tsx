'use client';

// ─── RichTextEditor.tsx ──────────────────────────────────────────────────────
// Lazy-loaded via dynamic import in consuming page:
//   const RichTextEditor = dynamic(() => import('@shared/components/forms/RichTextEditor'), { ssr: false })

import { useRef, useCallback, useId } from 'react';
import { useTranslations } from 'next-intl';
import { Bold, Italic, Underline, List, ListOrdered, Link } from 'lucide-react';
import { cn } from '@shared/utils/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type ExecCommand = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'createLink';

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

  const exec = useCallback((command: ExecCommand, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = window.prompt(t('enterUrl'));
    if (url) exec('createLink', url);
  }, [exec, t]);

  const toolbarButtons: { icon: React.ElementType; command?: ExecCommand; label: string; action?: () => void }[] = [
    { icon: Bold, command: 'bold', label: t('bold') },
    { icon: Italic, command: 'italic', label: t('italic') },
    { icon: Underline, command: 'underline', label: t('underline') },
    { icon: List, command: 'insertUnorderedList', label: t('bulletList') },
    { icon: ListOrdered, command: 'insertOrderedList', label: t('orderedList') },
    { icon: Link, label: t('link'), action: handleLink },
  ];

  return (
    <div
      className={cn(
        'border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--bg-surface)] focus-within:ring-2 focus-within:ring-[var(--color-ring)]',
        disabled && 'opacity-50',
        className
      )}
    >
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label={t('toolbar')}
        aria-controls={editorId}
        className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--color-border)] bg-[var(--bg-table-header)]"
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
                e.preventDefault(); // prevent losing selection
                btn.action ? btn.action() : btn.command && exec(btn.command);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--bg-sidebar-item-hover)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* Editable area */}
      <div
        id={editorId}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder ?? t('content')}
        contentEditable={!disabled}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        data-placeholder={placeholder ?? t('startTyping')}
        className={cn(
          'min-h-[140px] p-4 text-sm text-[var(--color-text-primary)] outline-none',
          'prose prose-sm max-w-none',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[var(--color-text-muted)]'
        )}
      />
    </div>
  );
}
