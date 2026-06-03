import type { Metadata } from 'next';
import { AdminCourseDetailClient } from './AdminCourseDetailClient';

export const metadata: Metadata = {
  title: 'Course Detail — Admin — EduCRM',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { id: string };
  searchParams: { edit?: string };
}

export default function AdminCourseDetailPage({ params, searchParams }: PageProps) {
  return (
    <AdminCourseDetailClient
      courseId={params.id}
      startInEditMode={searchParams.edit === '1'}
    />
  );
}
