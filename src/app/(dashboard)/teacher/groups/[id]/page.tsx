import type { Metadata } from "next";
import { TeacherGroupDetailClient } from "@/modules/teachers/components/TeacherGroupDetailClient";

export const metadata: Metadata = {
  title: "Group | EduCRM",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeacherGroupDetailPage({ params }: Props) {
  const { id } = await params;
  return <TeacherGroupDetailClient groupId={id} />;
}
