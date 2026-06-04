"use client";

import { motion } from "framer-motion";
import { AttendanceMarkingUI } from "./AttendanceMarkingUI";
import { ClipboardList } from "lucide-react";

// ─── TeacherAttendanceClient ──────────────────────────────────────────────────
//
// Full-feature page shell for the teacher "Mark Attendance" route.
// Provides:
//   - Animated page-level header with icon badge
//   - Responsive max-width container (max-w-3xl) that respects sidebar layout
//   - Framer Motion entry animation (fade + slide from top)
//   - Card wrapper with accessible section semantics
//   - Proper padding responsive to sm / lg breakpoints
//
// IMPORTANT: AttendanceMarkingUI is rendered as-is; this component is purely
// a layout + animation shell and does NOT manage any data itself.
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherAttendanceClient() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6 pb-8 max-w-3xl"
    >
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="flex items-start gap-3"
      >
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(99,102,241,0.12)" }}
          aria-hidden="true"
        >
          <ClipboardList
            size={20}
            className="text-[var(--brand-primary)]"
            aria-hidden="true"
          />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Mark Attendance
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Record student attendance for a group session.
          </p>
        </div>
      </motion.div>

      {/* ── Marking UI card ──────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        aria-label="Attendance marking form"
        className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]"
      >
        <AttendanceMarkingUI />
      </motion.section>
    </motion.div>
  );
}
