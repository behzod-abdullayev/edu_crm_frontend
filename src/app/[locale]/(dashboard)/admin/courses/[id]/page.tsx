import type { Metadata } from 'next';
import { AdminCourseDetailClient } from '@/app/(dashboard)/admin/courses/[id]/AdminCourseDetailClient';

export const metadata: Metadata = {
  title: 'Course Detail — Admin — EduCRM',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminCourseDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { edit } = await searchParams;
  return (
    <AdminCourseDetailClient
      courseId={id}
      startInEditMode={edit === '1'}
    />
  );
}
