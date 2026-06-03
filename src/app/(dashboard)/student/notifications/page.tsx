import type { Metadata } from "next";
import { StudentNotificationsClient } from "@/modules/students/components/StudentNotificationsClient";

export const metadata: Metadata = {
  title: "Notifications | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentNotificationsPage() {
  return <StudentNotificationsClient />;
}
