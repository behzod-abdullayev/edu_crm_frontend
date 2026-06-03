import type { Metadata } from "next";
import { TeacherProfileClient } from "@/modules/teachers/components/TeacherProfileClient";

export const metadata: Metadata = {
  title: "Profile | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherProfilePage() {
  return <TeacherProfileClient />;
}
