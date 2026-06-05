'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { httpClient } from '@/services/api/axios.instance';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useDebounce } from '@shared/hooks/useDebounce';
import { StudentTable } from '@/modules/students/components/StudentTable';
import { StudentCardList } from '@/modules/students/components/StudentCardList';
import { Input } from '@shared/components/ui/input';
// ✅ FIX: use `import type` for type-only imports (required with isolatedModules).
import type { PaginatedResponse } from '@generated/models';
import type { StudentListDto } from '@/modules/students/components/StudentTable';

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherStudentsClient() {
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', user?.id, 'students', page, debouncedSearch],
    queryFn: () =>
      httpClient
        .get<PaginatedResponse<StudentListDto>>(`/teachers/${user?.id}/students`, {
          params: {
            page,
            // ✅ FIX: API contract uses `limit`, not `pageSize`.
            limit: 20,
            search: debouncedSearch !== '' ? debouncedSearch : undefined,
          },
        })
        .then((r) => r.data),
    enabled: !!user?.id,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Reset to page 1 when the search query changes.
    setPage(1);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Page header ── */}
      <motion.div variants={headerVariants}>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Students
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          All students across your groups.
        </p>
      </motion.div>

      {/* ── Search bar ── */}
      <div className="relative max-w-xs">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search students…"
          className="pl-9"
          aria-label="Search students"
        />
      </div>

      {/* ── Data view — table on desktop, card list on mobile ── */}
      {isMobile ? (
        <StudentCardList
          students={data?.data ?? []}
          isLoading={isLoading}
          totalCount={data?.total ?? 0}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          basePath="/teacher/students"
        />
      ) : (
        <StudentTable
          data={data?.data ?? []}
          isLoading={isLoading}
          totalCount={data?.total ?? 0}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          basePath="/teacher/students"
        />
      )}
    </motion.div>
  );
}