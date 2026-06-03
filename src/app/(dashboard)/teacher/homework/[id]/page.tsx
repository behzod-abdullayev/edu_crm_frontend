import type { Metadata } from "next";
import { TeacherHomeworkDetailClient } from "@/modules/teachers/components/TeacherHomeworkDetailClient";

export const metadata: Metadata = {
  title: "Homework Grading | EduCRM",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeacherHomeworkDetailPage({ params }: Props) {
  const { id } = await params;
  return <TeacherHomeworkDetailClient homeworkId={id} />;
}
