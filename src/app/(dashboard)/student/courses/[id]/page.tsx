import type { Metadata } from "next";
import { StudentCourseDetailClient } from "@/modules/courses/components/StudentCourseDetailClient";

export const metadata: Metadata = {
  title: "Course | EduCRM",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const { id } = await params;
  return <StudentCourseDetailClient courseId={id} />;
}
