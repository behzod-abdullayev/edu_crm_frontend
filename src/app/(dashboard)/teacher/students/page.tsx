import type { Metadata } from "next";
import { TeacherStudentsClient } from "@/modules/teachers/components/TeacherStudentsClient";

export const metadata: Metadata = {
  title: "Students | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherStudentsPage() {
  return <TeacherStudentsClient />;
}
