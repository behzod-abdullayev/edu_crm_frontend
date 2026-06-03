import type { Metadata } from "next";
import { TeacherStudentDetailClient } from "@/modules/teachers/components/TeacherStudentDetailClient";

export const metadata: Metadata = {
  title: "Student | EduCRM",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeacherStudentDetailPage({ params }: Props) {
  const { id } = await params;
  return <TeacherStudentDetailClient studentId={id} />;
}
