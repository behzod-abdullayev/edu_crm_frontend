import type { Metadata } from "next";
import { StudentScheduleClient } from "@/modules/students/components/StudentScheduleClient";

export const metadata: Metadata = {
  title: "Schedule | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentSchedulePage() {
  return <StudentScheduleClient />;
}
