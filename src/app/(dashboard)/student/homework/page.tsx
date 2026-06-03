import type { Metadata } from "next";
import { StudentHomeworkClient } from "@/modules/students/components/StudentHomeworkClient";

export const metadata: Metadata = {
  title: "Homework | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentHomeworkPage() {
  return <StudentHomeworkClient />;
}
