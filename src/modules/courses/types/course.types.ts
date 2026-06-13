export interface CourseFormValues {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  categoryId: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  isPublished: boolean;
}

export interface CourseListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: "in-progress" | "completed" | "all";
  categoryId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  watchedSeconds?: number;
}

export interface ModuleWithLessons {
  id: string;
  title: string;
  order: number;
  lessons: LessonItem[];
}

export interface LessonItem {
  id: string;
  title: string;
  type: "video" | "pdf" | "text" | "quiz";
  durationMinutes?: number;
  fileKey?: string;
  videoUrl?: string;
  order: number;
  isCompleted: boolean;
}

export interface EnrollmentRecord {
  studentId: string;
  studentName: string;
  enrolledAt: string;
  progress: number;
  lastActivityAt?: string;
}
