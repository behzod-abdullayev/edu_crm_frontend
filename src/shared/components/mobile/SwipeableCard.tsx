'use client';

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
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

// ─── Zustand store — one card open at a time ──────────────────────────────────

interface OpenCardStore {
  openCardId: string | null;
  setOpenCard: (id: string | null) => void;
}

const useOpenCardStore = create<OpenCardStore>((set) => ({
  openCardId: null,
  setOpenCard: (id) => set({ openCardId: id }),
}));

let cardIdCounter = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  className,
}: SwipeableCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const { openCardId, setOpenCard } = useOpenCardStore();

  const cardIdRef = useRef<string>(`swipeable-card-${++cardIdCounter}`);
  const cardId = cardIdRef.current;

  const isOpen = openCardId === cardId;

  const ACTION_WIDTH = 64;
  const rightActionsWidth = rightActions.length * ACTION_WIDTH;
  const leftActionsWidth = leftActions.length * ACTION_WIDTH;

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 500, damping: 35 };

  const handleDragStart = useCallback(() => {
    // Close any other open card when this one starts dragging
    if (openCardId !== null && openCardId !== cardId) {
      setOpenCard(null);
    }
  }, [openCardId, cardId, setOpenCard]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      // Right swipe on open card → close
      if (isOpen && (velocity > 200 || offset > rightActionsWidth * 0.4)) {
        setOpenCard(null);
        return;
      }

      // Left swipe → open right actions
      if (rightActions.length > 0 && !isOpen) {
        if (velocity < -200 || offset < -(rightActionsWidth * 0.4)) {
          setOpenCard(cardId);
          return;
        }
      }

      // Right swipe → open left actions
      if (leftActions.length > 0 && !isOpen) {
        if (velocity > 200 || offset > leftActionsWidth * 0.4) {
          setOpenCard(cardId);
          return;
        }
      }

      // Snap back to closed
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
    ]
  );

  const targetX = isOpen && rightActions.length > 0 ? -rightActionsWidth : 0;

  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Right action buttons — revealed on left swipe */}
      {rightActions.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {rightActions.map((action) => {
            const Icon = action.icon;
            const isDanger = action.variant === 'danger';
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                aria-label={action.label}
                style={{
                  width: ACTION_WIDTH,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: isDanger
                    ? 'var(--error-solid)'
                    : 'var(--text-muted)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Left action buttons — revealed on right swipe */}
      {leftActions.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {leftActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                aria-label={action.label}
                style={{
                  width: ACTION_WIDTH,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Draggable card surface */}
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
        style={{ position: 'relative', background: 'var(--bg-surface)' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
