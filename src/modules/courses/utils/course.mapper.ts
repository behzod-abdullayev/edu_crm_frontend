import type { CourseFormValues, LessonItem, ModuleWithLessons } from '../types/course.types';

// Local DTO shapes (generated models are incomplete for this module)
export interface CourseDto {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  categoryId?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  isPublished?: boolean;
  status?: string;
  teacherId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseDto {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId?: string;
  difficultyLevel?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId?: string;
  difficultyLevel?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface LessonDto {
  id: string;
  title?: string;
  type?: string;
  durationMinutes?: number | null;
  fileKey?: string | null;
  videoUrl?: string | null;
  order?: number;
}

export interface ModuleDto {
  id: string;
  title?: string;
  order?: number;
  lessons?: LessonDto[];
}

export function mapCourseDtoToForm(dto: CourseDto): CourseFormValues {
  return {
    title: dto.title ?? '',
    description: dto.description ?? '',
    thumbnailUrl: dto.thumbnailUrl ?? null,
    categoryId: dto.categoryId ?? '',
    difficultyLevel: (dto.difficultyLevel as CourseFormValues['difficultyLevel']) ?? 'beginner',
    isPublished: dto.status ? dto.status === 'published' : (dto.isPublished ?? false),
  };
}

export function mapCourseFormToDto(form: CourseFormValues): CreateCourseDto | UpdateCourseDto {
  return {
    title: form.title,
    description: form.description,
    difficultyLevel: form.difficultyLevel,
    status: form.isPublished ? 'published' : 'draft',
    ...(form.categoryId ? { categoryId: form.categoryId } : {}),
    ...(form.thumbnailUrl ? { thumbnailUrl: form.thumbnailUrl } : {}),
  };
}

export function mapLessonDto(dto: LessonDto, completedIds: Set<string>): LessonItem {
  return {
    id: dto.id,
    title: dto.title ?? '',
    type: (dto.type as LessonItem['type']) ?? 'text',
    ...(dto.durationMinutes !== undefined && dto.durationMinutes !== null ? { durationMinutes: dto.durationMinutes } : {}),
    ...(dto.fileKey ? { fileKey: dto.fileKey } : {}),
    ...(dto.videoUrl ? { videoUrl: dto.videoUrl } : {}),
    order: dto.order ?? 0,
    isCompleted: completedIds.has(dto.id),
  };
}

export function mapModuleDto(dto: ModuleDto, completedLessonIds: Set<string>): ModuleWithLessons {
  return {
    id: dto.id,
    title: dto.title ?? '',
    order: dto.order ?? 0,
    lessons: (dto.lessons ?? []).map((l: LessonDto) => mapLessonDto(l, completedLessonIds)),
  };
}
