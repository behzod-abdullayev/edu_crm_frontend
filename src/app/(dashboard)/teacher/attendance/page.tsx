import type { Metadata } from "next";
import { TeacherAttendanceClient } from "@/modules/teachers/components/TeacherAttendanceClient";

export const metadata: Metadata = {
  title: "Attendance | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherAttendancePage() {
  return <TeacherAttendanceClient />;
}
