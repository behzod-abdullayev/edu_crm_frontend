'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, Search } from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Sheet ────────────────────────────────────────────────────────────────────

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-[var(--bg-surface)] border-[var(--color-border)] shadow-2xl transition-transform',
  {
    variants: {
      side: {
        top:    'inset-x-0 top-0 border-b rounded-b-2xl',
        bottom: 'inset-x-0 bottom-0 border-t rounded-t-2xl',
        left:   'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r',
        right:  'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l',
      },
    },
    defaultVariants: { side: 'right' },
  }
);

const slideFrom: Record<string, { initial: object; exit: object }> = {
  top:    { initial: { y: '-100%' }, exit: { y: '-100%' } },
  bottom: { initial: { y: '100%' },  exit: { y: '100%' } },
  left:   { initial: { x: '-100%' }, exit: { x: '-100%' } },
  right:  { initial: { x: '100%' },  exit: { x: '100%' } },
};

export const Sheet        = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose   = DialogPrimitive.Close;

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => {
  const sf = slideFrom[side ?? 'right']!;
  return (
    <DialogPrimitive.Portal>
      <AnimatePresence>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content asChild ref={ref} {...props}>
          <motion.div
            initial={{ ...sf.initial, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ ...sf.exit, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(sheetVariants({ side }), 'flex flex-col', className)}
          >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
              <X size={16} aria-hidden="true" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </AnimatePresence>
    </DialogPrimitive.Portal>
  );
});
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 px-6 py-5 border-b border-[var(--color-border)]', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-[var(--color-text-primary)]', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--color-text-muted)]', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';

export const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)} {...props} />
);
SheetBody.displayName = 'SheetBody';

export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-3 px-6 py-4 border-t border-[var(--color-border)]', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';

// ─── Command ──────────────────────────────────────────────────────────────────

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-xl bg-[var(--bg-surface)] text-[var(--color-text-primary)]',
      className
    )}
    {...props}
  />
));
Command.displayName = 'Command';

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4" cmdk-input-wrapper="">
    <Search size={15} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-12 w-full bg-transparent text-sm outline-none',
        'placeholder:text-[var(--color-text-muted)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-72 overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-10 text-center text-sm text-[var(--color-text-muted)]"
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 text-[var(--color-text-primary)]',
      '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
      '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--color-text-muted)]',
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 h-px bg-[var(--color-border)]', className)}
    {...props}
  />
));
CommandSeparator.displayName = 'CommandSeparator';

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none',
      'transition-colors aria-selected:bg-[var(--bg-sidebar-item-hover)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

export const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('ml-auto text-xs tracking-widest text-[var(--color-text-muted)]', className)}
    {...props}
  />
);
CommandShortcut.displayName = 'CommandShortcut';

// ─── ScrollArea ───────────────────────────────────────────────────────────────

export const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'vertical' | 'horizontal' }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative overflow-auto', className)}
    {...props}
  >
    {children}
  </div>
));
ScrollArea.displayName = 'ScrollArea';

export const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'vertical' | 'horizontal' }
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  />
));
ScrollBar.displayName = 'ScrollBar';
