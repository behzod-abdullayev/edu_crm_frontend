import type { Metadata } from "next";
import { TeacherAnalyticsClient } from "@/modules/teachers/components/TeacherAnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherAnalyticsPage() {
  return <TeacherAnalyticsClient />;
}
