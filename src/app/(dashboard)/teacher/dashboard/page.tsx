import type { Metadata } from "next";
import { TeacherDashboardClient } from "@/modules/teachers/components/TeacherDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherDashboardPage() {
  return <TeacherDashboardClient />;
}
