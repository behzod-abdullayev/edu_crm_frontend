import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentDashboardClient } from "@/modules/students/components/StudentDashboardClient";
import { StudentDashboardSkeleton } from "@/modules/students/components/StudentDashboardSkeleton";

export const metadata: Metadata = {
  title: "Dashboard | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentDashboardClient />
    </Suspense>
  );
}
