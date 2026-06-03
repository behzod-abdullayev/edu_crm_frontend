import type { Metadata } from "next";
import { StudentHomeworkDetailClient } from "@/modules/students/components/StudentHomeworkDetailClient";

export const metadata: Metadata = {
  title: "Homework | EduCRM",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentHomeworkDetailPage({ params }: Props) {
  const { id } = await params;
  return <StudentHomeworkDetailClient homeworkId={id} />;
}
