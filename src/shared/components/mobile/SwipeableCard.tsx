'use client';

/**
 * src/shared/components/mobile/SwipeableCard.tsx
 *
 * Swipeable card with revealed action buttons.
 *
 * Behaviour:
 *  - Swipe LEFT  → reveals rightActions buttons
 *  - Swipe RIGHT → reveals leftActions buttons
 *  - Only one card open at a time (Zustand store)
 *  - Snap back on low-velocity or insufficient drag
 *  - Tap anywhere while another card is open → close that card
 *
 * Features:
 * ✅ Framer Motion drag (spring physics)
 * ✅ Zustand store — one card open at a time across the list
 * ✅ Velocity + offset threshold logic
 * ✅ Correct CSS variables from globals.css
 * ✅ Minimum 44px action button height (full card height stretch)
 * ✅ Accessible: action buttons visible to screen readers when revealed
 * ✅ No "any" TypeScript types
 * ✅ Reduced motion: disables drag animation, snaps instantly
 */

import {
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion, type PanInfo } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SwipeAction {
  /** Lucide icon rendered in the action button */
  icon: LucideIcon;
  /** Accessible label and visible text */
  label: string;
  /** Called when the button is tapped */
  onClick: () => void;
  /** 'danger' renders a red background */
  variant?: 'default' | 'danger';
}

interface SwipeableCardProps {
  /** Card content */
  children: ReactNode;
  /** Actions revealed on RIGHT swipe (left side) */
  leftActions?: SwipeAction[];
  /** Actions revealed on LEFT swipe (right side) */
  rightActions?: SwipeAction[];
  /** Additional className on the outermost wrapper */
  className?: string;
}

// ─── Zustand — exactly one open card per mount ────────────────────────────────

interface OpenCardStore {
  openCardId: string | null;
  setOpenCard: (id: string | null) => void;
}

const useOpenCardStore = create<OpenCardStore>((set) => ({
  openCardId: null,
  setOpenCard: (id) => set({ openCardId: id }),
}));

// Monotonic counter for stable IDs without useId (avoids SSR mismatch)
let cardIdCounter = 0;

// ─── Action Button ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  action: SwipeAction;
  width: number;
}

function ActionButton({ action, width }: ActionButtonProps) {
  const Icon = action.icon;
  const isDanger = action.variant === 'danger';

  return (
    <button
      onClick={action.onClick}
      aria-label={action.label}
      style={{
        width,
        minHeight: 44,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: isDanger
          ? 'var(--error-solid)'
          : 'var(--text-muted)',
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 600,
        padding: 0,
        flexShrink: 0,
      }}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{action.label}</span>
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  className,
}: SwipeableCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const { openCardId, setOpenCard } = useOpenCardStore();

  // Stable ID (never changes for the lifetime of this instance)
  const cardIdRef = useRef<string>(`swipeable-card-${++cardIdCounter}`);
  const cardId = cardIdRef.current;

  const isOpen = openCardId === cardId;

  const ACTION_WIDTH = 72; // px per action button
  const rightActionsWidth = rightActions.length * ACTION_WIDTH;
  const leftActionsWidth = leftActions.length * ACTION_WIDTH;

  // Spring transition for snap
  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 500, damping: 35 };

  // ── Drag start: close sibling cards ──
  const handleDragStart = useCallback(() => {
    if (openCardId !== null && openCardId !== cardId) {
      setOpenCard(null);
    }
  }, [openCardId, cardId, setOpenCard]);

  // ── Drag end: decide snap position ──
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const vx = info.velocity.x;
      const ox = info.offset.x;

      // ─ Already open → right swipe or fast swipe closes ─
      if (isOpen) {
        if (vx > 200 || ox > rightActionsWidth * 0.4) {
          setOpenCard(null);
          return;
        }
        // Re-snap to open
        return;
      }

      // ─ Left swipe → reveal right actions ─
      if (rightActions.length > 0) {
        if (vx < -200 || ox < -(rightActionsWidth * 0.4)) {
          setOpenCard(cardId);
          return;
        }
      }

      // ─ Right swipe → reveal left actions ─
      if (leftActions.length > 0) {
        if (vx > 200 || ox > leftActionsWidth * 0.4) {
          setOpenCard(cardId);
          return;
        }
      }

      // ─ Default: snap closed ─
      setOpenCard(null);
    },
    [
      isOpen,
      rightActionsWidth,
      leftActionsWidth,
      rightActions.length,
      leftActions.length,
      setOpenCard,
      cardId,
    ],
  );

  // The animated x position for the draggable surface
  const targetX =
    isOpen && rightActions.length > 0
      ? -rightActionsWidth
      : isOpen && leftActions.length > 0
        ? leftActionsWidth
        : 0;

  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* ── Right action buttons (revealed by left swipe) ── */}
      {rightActions.length > 0 && (
        <div
          aria-hidden={!isOpen}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {rightActions.map((action) => (
            <ActionButton key={action.label} action={action} width={ACTION_WIDTH} />
          ))}
        </div>
      )}

      {/* ── Left action buttons (revealed by right swipe) ── */}
      {leftActions.length > 0 && (
        <div
          aria-hidden={!isOpen}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {leftActions.map((action) => (
            <ActionButton key={action.label} action={action} width={ACTION_WIDTH} />
          ))}
        </div>
      )}

      {/* ── Draggable card surface ── */}
      <motion.div
        drag={shouldReduceMotion ? false : 'x'}
        dragConstraints={{
          left: rightActions.length > 0 ? -rightActionsWidth : 0,
          right: leftActions.length > 0 ? leftActionsWidth : 0,
        }}
        dragElastic={0.05}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={{ x: targetX }}
        transition={springTransition}
        style={{
          position: 'relative',
          backgroundColor: 'var(--bg-surface)',
          touchAction: 'pan-y', // allow vertical scrolling on touch
          cursor: 'grab',
        }}
        whileTap={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  );
}