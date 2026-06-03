import type { Metadata } from "next";
import { StudentGradesClient } from "@/modules/students/components/StudentGradesClient";

export const metadata: Metadata = {
  title: "Grades | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentGradesPage() {
  return <StudentGradesClient />;
}
