"use client";

import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { mapAttendanceDto } from "../utils/student.mapper";
import type { AttendanceDto } from "@generated/models";
import type { AttendanceRecord } from "../types/student.types";

interface AttendanceParams {
  month?: number;
  year?: number;
  courseId?: string;
}

export function useStudentAttendance(studentId: string, params?: AttendanceParams) {
  return useQuery({
    queryKey: ["students", studentId, "attendance", params],
    queryFn: async () => {
      const res = await httpClient.get<AttendanceDto[]>(
        `/students/${studentId}/attendance`,
        {
          params: {
            month: params?.month,
            year: params?.year,
            courseId: params?.courseId,
          },
        }
      );
      // Fix: build an object that satisfies AttendanceDto with exactOptionalPropertyTypes.
      // Optional fields must be omitted (not passed as undefined) when absent.
      return res.data.map((dto: AttendanceDto): AttendanceRecord => {
        const normalized: AttendanceDto = {
          id: dto.id,
          studentId: dto.studentId,
          courseId: dto.courseId,
          date: dto.date,
          status: dto.status,
          // Only include optional fields when they are actually present
          ...(dto.courseName !== undefined && { courseName: dto.courseName }),
          ...(dto.teacherName !== undefined && { teacherName: dto.teacherName }),
          ...(dto.note !== undefined && { note: dto.note }),
        };
        return mapAttendanceDto(normalized);
      });
    },
    enabled: !!studentId,
    select: (data: AttendanceRecord[]) => ({
      records: data,
      rate: computeRate(data),
      totalPresent: data.filter((r) => r.status === "present").length,
      totalAbsent: data.filter((r) => r.status === "absent").length,
      totalLate: data.filter((r) => r.status === "late").length,
      totalExcused: data.filter((r) => r.status === "excused").length,
    }),
  });
}

function computeRate(records: AttendanceRecord[]): number {
  if (!records.length) return 0;
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  return Math.round(((present + late * 0.5) / records.length) * 100);
}