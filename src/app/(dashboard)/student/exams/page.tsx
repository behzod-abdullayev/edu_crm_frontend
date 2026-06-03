import type { Metadata } from "next";
import { StudentExamsClient } from "@/modules/students/components/StudentExamsClient";

export const metadata: Metadata = {
  title: "Exams | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentExamsPage() {
  return <StudentExamsClient />;
}
