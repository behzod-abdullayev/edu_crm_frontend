'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonLoader } from './SkeletonLoader';

interface PageLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function PageLoader({ isLoading, children }: PageLoaderProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="page-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Loading page content"
          aria-busy="true"
          className="space-y-6 p-6"
        >
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} variant="kpi" />
            ))}
          </div>
          {/* Chart row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonLoader variant="chart" />
            <SkeletonLoader variant="chart" />
          </div>
          {/* Table */}
          <SkeletonLoader variant="table" />
        </motion.div>
      ) : (
        <motion.div
          key="page-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
