import type { Metadata } from "next";
import { TeacherExamsClient } from "@/modules/teachers/components/TeacherExamsClient";

export const metadata: Metadata = {
  title: "Exams | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherExamsPage() {
  return <TeacherExamsClient />;
}
