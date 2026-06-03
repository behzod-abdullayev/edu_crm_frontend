import type { Metadata } from "next";
import { TeacherGroupsClient } from "@/modules/teachers/components/TeacherGroupsClient";

export const metadata: Metadata = {
  title: "Groups | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherGroupsPage() {
  return <TeacherGroupsClient />;
}
