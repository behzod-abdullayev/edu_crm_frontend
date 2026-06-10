'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/utils/cn';

// ─── Drawer (bottom / side sheet via Radix Dialog) ────────────────────────────

const drawerVariants = cva(
  'fixed z-50 bg-[var(--bg-surface)] border border-[var(--color-border)] shadow-2xl overflow-auto',
  {
    variants: {
      side: {
        bottom: 'inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]',
        right:  'inset-y-0 right-0 w-80 rounded-l-2xl',
        left:   'inset-y-0 left-0 w-80 rounded-r-2xl',
        top:    'inset-x-0 top-0 rounded-b-2xl max-h-[90vh]',
      },
    },
    defaultVariants: { side: 'bottom' },
  }
);

type SlideProps = { initial: Record<string, string | number>; animate: Record<string, string | number>; exit: Record<string, string | number> };

const SLIDE_BOTTOM: SlideProps = { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
const SLIDE_RIGHT: SlideProps  = { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
const SLIDE_LEFT: SlideProps   = { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } };
const SLIDE_TOP: SlideProps    = { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } };

function getSlideVariant(side: 'bottom' | 'right' | 'left' | 'top'): SlideProps {
  if (side === 'right') return SLIDE_RIGHT;
  if (side === 'left') return SLIDE_LEFT;
  if (side === 'top') return SLIDE_TOP;
  return SLIDE_BOTTOM;
}

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {}

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = 'bottom', ...props }, ref) => {
  const resolvedSide: 'bottom' | 'right' | 'left' | 'top' = side ?? 'bottom';
  const sv = getSlideVariant(resolvedSide);
  return (
    <DialogPrimitive.Portal>
      <AnimatePresence>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content asChild ref={ref} {...props}>
          <motion.div
            initial={sv.initial}
            animate={sv.animate}
            exit={sv.exit}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(drawerVariants({ side }), className)}
          >
            {resolvedSide === 'bottom' && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" aria-hidden="true" />
              </div>
            )}
            {children}
          </motion.div>
        </DialogPrimitive.Content>
      </AnimatePresence>
    </DialogPrimitive.Portal>
  );
});
DrawerContent.displayName = 'DrawerContent';

export const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-base font-semibold text-[var(--color-text-primary)]', className)}
    {...props}
  />
));
DrawerTitle.displayName = 'DrawerTitle';

export const DrawerBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4 flex-1 overflow-y-auto', className)} {...props} />
);
DrawerBody.displayName = 'DrawerBody';

export const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-3 px-5 py-4 border-t border-[var(--color-border)]', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';
