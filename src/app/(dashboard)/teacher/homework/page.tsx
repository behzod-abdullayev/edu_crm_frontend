import type { Metadata } from "next";
import { TeacherHomeworkClient } from "@/modules/teachers/components/TeacherHomeworkClient";

export const metadata: Metadata = {
  title: "Homework | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherHomeworkPage() {
  return <TeacherHomeworkClient />;
}
