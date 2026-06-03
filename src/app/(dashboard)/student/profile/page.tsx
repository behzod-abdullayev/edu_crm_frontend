import type { Metadata } from "next";
import { StudentProfileClient } from "@/modules/students/components/StudentProfileClient";

export const metadata: Metadata = {
  title: "Profile | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentProfilePage() {
  return <StudentProfileClient />;
}
