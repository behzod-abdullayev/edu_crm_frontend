import type { Metadata } from "next";
import { CourseList } from "@/modules/courses/components/CourseList";

export const metadata: Metadata = {
  title: "My Courses | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentCoursesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse and continue your enrolled courses.</p>
      </div>
      <CourseList />
    </div>
  );
}
