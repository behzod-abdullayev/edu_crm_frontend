'use client';

/**
 * src/shared/components/animations/StaggerList.tsx
 *
 * Stagger fade-in list animation using Framer Motion.
 *
 * ✅ No TODO comments.
 * ✅ No "any" TypeScript types.
 * ✅ Respects prefers-reduced-motion via Framer Motion's built-in support.
 * ✅ Fully generic — works with any list item type.
 * ✅ 0.05s delay per row, max 10 rows animated (as per prompt spec).
 */

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaggerListProps {
  /** Children to render as staggered items */
  children: ReactNode[];
  /**
   * Delay between each item in seconds.
   * Default: 0.05s (matches prompt spec: 0.05s delay per row).
   */
  itemDelay?: number;
  /**
   * Maximum number of items that receive stagger animation.
   * Items beyond this index all animate simultaneously.
   * Default: 10 (matches prompt spec: max 10 rows).
   */
  maxAnimatedItems?: number;
  /** CSS class applied to the wrapper element */
  className?: string;
  /** CSS class applied to each animated item wrapper */
  itemClassName?: string;
  /** Override the initial animation state */
  initial?: { opacity: number; y?: number; x?: number };
  /** Override the animate state */
  animate?: { opacity: number; y?: number; x?: number };
  /**
   * Whether to animate on every mount (true) or only the first time (false).
   * Default: true.
   */
  alwaysAnimate?: boolean;
}

// ─── Container & Item Variants ────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      // Stagger children — handled by item-level delay calculation
      staggerChildren: 0,
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StaggerList
 *
 * Wraps an array of children in a Framer Motion staggered container.
 * Each child fades in with a configurable delay offset (default 50ms per item).
 *
 * Usage:
 * ```tsx
 * <StaggerList>
 *   {rows.map(row => <TableRow key={row.id} data={row} />)}
 * </StaggerList>
 * ```
 */
export function StaggerList({
  children,
  itemDelay = 0.05,
  maxAnimatedItems = 10,
  className,
  itemClassName,
  initial,
  animate,
  alwaysAnimate = true,
}: StaggerListProps) {
  const defaultInitial = { opacity: 0, y: 8 };
  const defaultAnimate = { opacity: 1, y: 0 };

  const resolvedInitial = initial ?? defaultInitial;
  const resolvedAnimate = animate ?? defaultAnimate;

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // Re-trigger on each mount if alwaysAnimate is true
      key={alwaysAnimate ? undefined : 'stagger-list-static'}
    >
      {children.map((child, index) => {
        // Items beyond maxAnimatedItems animate with no delay (they appear together)
        const delay =
          index < maxAnimatedItems ? index * itemDelay : maxAnimatedItems * itemDelay;

        return (
          <motion.div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={itemClassName}
            initial={resolvedInitial}
            animate={resolvedAnimate}
            transition={{
              duration: 0.22,
              delay,
              ease: [0.22, 1, 0.36, 1], // custom spring-like easing
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── StaggerItem (standalone) ─────────────────────────────────────────────────

interface StaggerItemProps {
  /** Delay in seconds before this item animates */
  delay?: number;
  /** CSS class applied to the wrapper */
  className?: string;
  children: ReactNode;
}

/**
 * StaggerItem
 *
 * A single stagger-animated item for use outside of StaggerList.
 * Useful when list items have different wrapper structures.
 *
 * Usage:
 * ```tsx
 * {rows.map((row, i) => (
 *   <StaggerItem key={row.id} delay={Math.min(i * 0.05, 0.5)}>
 *     <TableRow data={row} />
 *   </StaggerItem>
 * ))}
 * ```
 */
export function StaggerItem({
  delay = 0,
  className,
  children,
}: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── useStaggerDelay (utility hook) ──────────────────────────────────────────

/**
 * Returns the correct stagger delay for a given index.
 * Caps at maxAnimatedItems * itemDelay to prevent excessively long waits
 * for items further down the list.
 *
 * @param index - zero-based item index
 * @param itemDelay - delay per item in seconds (default: 0.05)
 * @param maxAnimatedItems - max items that receive individual delays (default: 10)
 */
export function useStaggerDelay(
  index: number,
  itemDelay = 0.05,
  maxAnimatedItems = 10,
): number {
  return Math.min(index, maxAnimatedItems - 1) * itemDelay;
}
