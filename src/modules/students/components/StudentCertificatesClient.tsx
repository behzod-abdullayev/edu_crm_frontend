"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { CertificateDownload, type CertificateDto } from "./CertificateDownload";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";
import { cn } from "@shared/lib/utils";

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-xl overflow-hidden", className)}
      style={{
        background:
          "linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s linear infinite",
      }}
      aria-hidden="true"
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-20 flex flex-col items-center gap-4 text-center"
      role="status"
    >
      <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
        <Award
          className="w-10 h-10 text-amber-400"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-[var(--text-primary)]">
          No certificates yet
        </p>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
          Complete a course to earn your first certificate of completion.
        </p>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function StudentCertificatesClient() {
  const { user } = useCurrentUser();
  const certsEnabled = useFeatureFlag("certificates");

  const { data: certs, isLoading } = useQuery({
    queryKey: ["students", user?.id, "certificates"],
    queryFn: async () => {
      const res = await httpClient.get<CertificateDto[]>(
        `/students/${user?.id ?? ""}/certificates`,
      );
      return res.data;
    },
    enabled: !!user?.id && certsEnabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Feature flag guard
  if (!certsEnabled) {
    return (
      <div className="py-20 text-center text-[var(--text-muted)] text-sm" role="status">
        Certificates are not enabled for this account.
      </div>
    );
  }

  const certList = certs ?? [];

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Certificates
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {isLoading
              ? "Loading…"
              : `${certList.length} certificate${certList.length !== 1 ? "s" : ""} earned`}
          </p>
        </div>

        {/* Badge count bubble */}
        {!isLoading && certList.length > 0 && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </motion.div>
        )}
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-busy="true"
          aria-label="Loading certificates"
        >
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-64" />
          ))}
        </div>
      ) : certList.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.07 } },
            hidden: {},
          }}
        >
          {certList.map((cert) => (
            <motion.div
              key={cert.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3 },
                },
              }}
            >
              <CertificateDownload certificate={cert} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
