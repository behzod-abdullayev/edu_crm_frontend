import type { Metadata } from "next";
import { TeacherLessonsClient } from "@/modules/teachers/components/TeacherLessonsClient";

export const metadata: Metadata = {
  title: "Lessons | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherLessonsPage() {
  return <TeacherLessonsClient />;
}
