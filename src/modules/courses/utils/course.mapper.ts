import type { CourseFormValues, LessonItem, ModuleWithLessons } from '../types/course.types';
import type { Course } from '@/services/api/courses.api';

// Local DTO shapes (generated models are incomplete for this module)
export interface CourseDto {
  id: string;
  name: string;
  description?: string;
  thumbnailKey?: string | null;
  thumbnailUrl?: string | null;
  categoryId?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  isPublished?: boolean;
  status?: string;
  teacherId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseDto {
  name: string;
  description?: string;
  thumbnailKey?: string;
  categoryId?: string;
  level?: string;
  isPublished?: boolean;
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
  thumbnailKey?: string;
  categoryId?: string;
  level?: string;
  isPublished?: boolean;
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
    name: dto.name ?? '',
    description: dto.description ?? '',
    thumbnailKey: dto.thumbnailKey ?? null,
    categoryId: dto.categoryId ?? '',
    level: (dto.level as CourseFormValues['level']) ?? 'beginner',
    isPublished: dto.isPublished ?? false,
  };
}

export function mapCourseFormToDto(form: CourseFormValues): CreateCourseDto | UpdateCourseDto {
  return {
    name: form.name,
    description: form.description,
    ...(form.thumbnailKey ? { thumbnailKey: form.thumbnailKey } : {}),
    categoryId: form.categoryId,
    level: form.level,
    isPublished: form.isPublished,
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
