"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { ChatInterface } from "./ChatInterface";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";

// ─── TeacherChatClient ────────────────────────────────────────────────────────
//
// Page shell for the teacher "Messages / Chat" route.
// Guards rendering behind the `chatEnabled` feature flag from tenant config.
//
// Layout:
//   - Full remaining viewport height on desktop (h-[calc(100vh-var(--header-height)-2*24px)])
//   - Full height on mobile (h-[calc(100dvh-var(--header-height-mobile)-var(--bottom-nav-height))])
//   - ChatInterface is stretched to fill all available vertical space
//   - Framer Motion fade-in entry animation
//
// Accessibility:
//   - <main> landmark delegated to the layout; this uses a <section> with label
//   - "Chat is not enabled" shown as a non-intrusive info state (not an error)
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherChatClient() {
  const chatEnabled = useFeatureFlag("chat");

  // ── Feature flag gate ────────────────────────────────────────────────────
  if (!chatEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(148,163,184,0.12)" }}
          aria-hidden="true"
        >
          <MessageSquare
            size={24}
            className="text-[var(--text-muted)]"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
          Chat is not enabled for your organisation.
          <br />
          Contact your administrator to enable this feature.
        </p>
      </motion.div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={[
        // Stack the header + chat interface vertically and fill remaining height
        "flex flex-col gap-4",
        // On mobile: full dynamic viewport minus top header and bottom nav
        "h-[calc(100dvh-var(--header-height-mobile)-var(--bottom-nav-height)-2rem)]",
        // On desktop: full viewport minus desktop header
        "lg:h-[calc(100vh-var(--header-height)-3rem)]",
        // Extra bottom padding on desktop so content doesn't hug edge
        "pb-0",
      ].join(" ")}
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
        className="flex items-start gap-3 shrink-0"
      >
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
          aria-hidden="true"
        >
          <MessageSquare
            size={20}
            className="text-[var(--role-teacher)]"
            aria-hidden="true"
          />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Messages
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Chat with your students.
          </p>
        </div>
      </motion.div>

      {/* ── Chat interface — occupies remaining height ───────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        aria-label="Chat messages"
        className="flex-1 min-h-0 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] overflow-hidden"
      >
        <ChatInterface />
      </motion.section>
    </motion.div>
  );
}
