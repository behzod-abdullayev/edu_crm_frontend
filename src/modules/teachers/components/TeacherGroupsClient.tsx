"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { GroupDashboard } from "./GroupDashboard";
import { EmptyState } from "@shared/components/data-display/EmptyState";
import { ErrorState } from "@shared/components/data-display/ErrorState";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import {
  Users,
  LayoutGrid,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import type { Group } from "@generated/models";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

type StatusOption = (typeof STATUS_OPTIONS)[number]["value"];

// ─── Skeleton Cards ───────────────────────────────────────────────────────────

function GroupCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-4"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 rounded-md w-3/4" />
          <div className="skeleton h-3.5 rounded-md w-1/2" />
        </div>
        <div className="skeleton h-6 rounded-full w-16" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-surface-secondary)]">
            <div className="skeleton h-4 w-4 rounded-full" />
            <div className="skeleton h-5 w-8 rounded-md" />
            <div className="skeleton h-3 w-10 rounded-md" />
          </div>
        ))}
      </div>
      {/* Next class */}
      <div className="skeleton h-8 rounded-lg w-full" />
    </div>
  );
}

// ─── Mobile Card Skeleton ─────────────────────────────────────────────────────

function MobileGroupCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5 flex-1">
          <div className="skeleton h-4 rounded-md w-2/3" />
          <div className="skeleton h-3 rounded-md w-1/2" />
        </div>
        <div className="skeleton h-5 rounded-full w-14" />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-8 flex-1 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

interface StatsBarProps {
  groups: Group[];
}

function StatsBar({ groups }: StatsBarProps) {
  const activeCount = groups.filter((g) => g.isActive !== false).length;
  const totalStudents = groups.reduce((sum, g) => sum + (g.studentCount ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-4 flex-wrap"
    >
      <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
        <LayoutGrid className="w-4 h-4 text-[var(--brand-primary)]" aria-hidden="true" />
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{groups.length}</span>
        {groups.length === 1 ? "group" : "groups"}
      </span>
      <span className="w-px h-4 bg-[var(--border-default)]" aria-hidden="true" />
      <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
        <Users className="w-4 h-4 text-[var(--brand-secondary)]" aria-hidden="true" />
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{totalStudents}</span>
        students total
      </span>
      {activeCount < groups.length && (
        <>
          <span className="w-px h-4 bg-[var(--border-default)]" aria-hidden="true" />
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">{activeCount}</span> active
          </span>
        </>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function TeacherGroupsClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusOption>("active");

  const teacherId = user?.id ?? "";

  const {
    data: groups,
    isLoading,
    isError,
    error,
    refetch,
  } = useTeacherGroups(teacherId, status);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["teachers", teacherId, "groups", status],
    });
  }, [queryClient, teacherId, status]);

  // ─── Desktop skeleton grid ───────────────────────────────────────────────────
  const skeletonCount = isMobile ? 3 : 6;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1 min-w-0">
          <h1
            className={cn(
              "font-bold tracking-tight text-[var(--text-primary)]",
              isMobile ? "text-xl" : "text-3xl"
            )}
          >
            My Groups
          </h1>
          {!isLoading && !isError && groups && <StatsBar groups={groups} />}
          {isLoading && (
            <div className="skeleton h-4 w-40 rounded-md" aria-hidden="true" />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            aria-label="Refresh groups"
            className="h-9 w-9 p-0"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </Button>

          {/* Status filter */}
          <div
            role="group"
            aria-label="Filter groups by status"
            className="flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-1"
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                aria-pressed={status === opt.value}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition-all duration-[var(--transition-base)] capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1",
                  status === opt.value
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error State ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorState
              error={error instanceof Error ? error : new Error("Failed to load groups")}
              title="Could not load groups"
              onRetry={() => void refetch()}
            />
          </motion.div>
        )}

        {/* ── Skeleton Loading ───────────────────────────────────────────────── */}
        {isLoading && !isError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "grid gap-4",
              isMobile
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
            aria-busy="true"
            aria-live="polite"
            aria-label="Loading groups"
          >
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                {isMobile ? <MobileGroupCardSkeleton /> : <GroupCardSkeleton />}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Empty State ────────────────────────────────────────────────────── */}
        {!isLoading && !isError && (groups ?? []).length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <EmptyState
              icon={FolderOpen}
              title={
                status === "active"
                  ? "No active groups"
                  : status === "archived"
                  ? "No archived groups"
                  : "No groups yet"
              }
              description={
                status === "active"
                  ? "You don't have any active groups assigned."
                  : status === "archived"
                  ? "No groups have been archived."
                  : "Groups will appear here once assigned."
              }
            />
          </motion.div>
        )}

        {/* ── Groups Grid ────────────────────────────────────────────────────── */}
        {!isLoading && !isError && (groups ?? []).length > 0 && (
          <motion.div
            key={`groups-${status}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "grid gap-4",
              isMobile
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
            role="list"
            aria-label={`${status} groups`}
          >
            {(groups ?? []).map((group: Group) => (
              <motion.div key={group.id} variants={itemVariants} role="listitem">
                <GroupDashboard group={group} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
