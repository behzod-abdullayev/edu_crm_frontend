"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { StudentAnalyticsChart } from "./StudentAnalyticsChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Button } from "@shared/components/ui/button";
import { BarChart2, RefreshCw } from "lucide-react";

// ─── Lazy-load heavy chart bundle ─────────────────────────────────────────────
const TeacherAnalyticsCharts = dynamic(() => import("./TeacherAnalyticsCharts"), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      aria-label="Loading analytics charts"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-52 rounded-xl bg-muted animate-[shimmer_1.5s_infinite]"
        />
      ))}
    </div>
  ),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

function defaultDateFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return toISODate(d);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherAnalyticsClient() {
  const { data: user } = useCurrentUser();
  const teacherId = user?.id ?? "";

  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useTeacherGroups(
    teacherId,
  );

  const [groupId, setGroupId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>(defaultDateFrom);
  const [dateTo, setDateTo] = useState<string>(() => toISODate(new Date()));

  // Resolve optional groupId — satisfy exactOptionalPropertyTypes:
  // we never pass an explicit `undefined` value; instead we omit the prop.
  const selectedGroupId: string | undefined = groupId !== "all" ? groupId : undefined;

  // Quick date range presets
  const applyPreset = (months: number) => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    setDateFrom(toISODate(from));
    setDateTo(toISODate(to));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-5 h-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Performance and engagement insights for your students.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-4 space-y-4"
        role="search"
        aria-label="Analytics filters"
      >
        {/* Group selector + date range */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Group */}
          <div className="space-y-1.5 min-w-[160px]">
            <Label htmlFor="analytics-group">Group</Label>
            {groupsLoading ? (
              <div
                aria-busy="true"
                aria-label="Loading groups"
                className="h-10 w-48 rounded-md bg-muted animate-[shimmer_1.5s_infinite]"
              />
            ) : (
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="analytics-group" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {(groups ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date from */}
          <div className="space-y-1.5">
            <Label htmlFor="analytics-from">From</Label>
            <Input
              id="analytics-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo}
              className="w-40"
              aria-label="Analytics start date"
            />
          </div>

          {/* Date to */}
          <div className="space-y-1.5">
            <Label htmlFor="analytics-to">To</Label>
            <Input
              id="analytics-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom}
              className="w-40"
              aria-label="Analytics end date"
            />
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetchGroups()}
            aria-label="Refresh groups list"
            className="self-end h-10"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick range:</span>
          {(
            [
              { label: "Last month", months: 1 },
              { label: "3 months", months: 3 },
              { label: "6 months", months: 6 },
              { label: "1 year", months: 12 },
            ] as { label: string; months: number }[]
          ).map(({ label, months }) => (
            <button
              key={months}
              type="button"
              onClick={() => applyPreset(months)}
              className="px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Student / group performance charts */}
      <motion.section
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        aria-label="Student performance"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Performance Overview
        </h2>
        {/*
          Spread the optional prop to satisfy exactOptionalPropertyTypes —
          never pass an explicit `undefined` value.
        */}
        {selectedGroupId !== undefined ? (
          <StudentAnalyticsChart groupId={selectedGroupId} />
        ) : (
          <StudentAnalyticsChart />
        )}
      </motion.section>

      {/* Teacher-level analytics charts */}
      <motion.section
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        aria-label="Homework and grade analytics"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Homework & Grades
        </h2>
        <TeacherAnalyticsCharts
          teacherId={teacherId}
          {...(selectedGroupId !== undefined ? { groupId: selectedGroupId } : {})}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </motion.section>
    </div>
  );
}
