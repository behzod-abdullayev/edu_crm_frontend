import type { Metadata } from "next";
import { StudentAttendanceClient } from "@/modules/students/components/StudentAttendanceClient";

export const metadata: Metadata = {
  title: "Attendance | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentAttendancePage() {
  return <StudentAttendanceClient />;
}
