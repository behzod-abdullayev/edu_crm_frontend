"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { StudentTable } from "@/modules/students/components/StudentTable";
import { StudentCardList } from "@/modules/students/components/StudentCardList";
import { Input } from "@shared/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import type { PaginatedResponse } from "@generated/models";
import type { StudentListDto } from "@/modules/students/components/StudentTable";

export function TeacherStudentsClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", user?.id, "students", page, debouncedSearch],
    queryFn: () =>
      httpClient
        .get<PaginatedResponse<StudentListDto>>(`/teachers/${user?.id}/students`, {
          params: { page, pageSize: 20, search: debouncedSearch || undefined },
        })
        .then((r) => r.data),
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-muted-foreground text-sm mt-1">All students across your groups.</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students…"
          className="pl-9"
        />
      </div>

      {isMobile ? (
        <StudentCardList
          students={data?.data ?? []}
          isLoading={isLoading}
          totalCount={data?.total ?? 0}
          page={page}
          pageSize={20}
          onPageChange={setPage}
        />
      ) : (
        <StudentTable
          data={data?.data ?? []}
          isLoading={isLoading}
          totalCount={data?.total ?? 0}
          page={page}
          pageSize={20}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
