import { format } from 'date-fns';
import type {
  CourseDto,
  TeacherDto,
  StudentDto,
  ScheduleEvent,
  ActivityItem,
  AdminDashboardData,
} from '../types/admin.types';

export interface CourseDisplayRow {
  id: string;
  name: string;
  teacherName: string;
  studentsEnrolled: number;
  price: string;
  status: string;
  startDate: string;
}

export interface TeacherDisplayRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupsAssigned: number;
  joinedDate: string;
  status: string;
}

export interface StudentDisplayRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  courseCount: number;
  attendancePercent: string;
  balance: string;
  status: string;
  paymentStatus: string;
}

export function mapCourseDtoToRow(dto: CourseDto): CourseDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    teacherName: dto.teacherName,
    studentsEnrolled: dto.studentsEnrolled,
    price: `${dto.price.toLocaleString()} ${dto.currency}`,
    status: dto.status,
    startDate: format(new Date(dto.startDate), 'dd MMM yyyy'),
  };
}

export function mapTeacherDtoToRow(dto: TeacherDto): TeacherDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    groupsAssigned: dto.groupsAssigned,
    joinedDate: format(new Date(dto.joinedDate), 'dd MMM yyyy'),
    status: dto.status,
  };
}

export function mapStudentDtoToRow(dto: StudentDto): StudentDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    courseCount: dto.courses.length,
    attendancePercent: `${dto.attendancePercent}%`,
    balance: `${dto.balance.toLocaleString()} ${dto.currency}`,
    status: dto.status,
    paymentStatus: dto.paymentStatus,
  };
}

export function mapScheduleEventToCalendar(event: ScheduleEvent): {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduleEvent;
} {
  return {
    id: event.id,
    title: `${event.courseName} — ${event.room}`,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    resource: event,
  };
}

export function mapActivityItemToDisplay(item: ActivityItem): {
  id: string;
  icon: string;
  description: string;
  actor: string;
  timeAgo: string;
} {
  const iconMap: Record<ActivityItem['type'], string> = {
    payment: '💳',
    enrollment: '📚',
    event: '📅',
  };

  return {
    id: item.id,
    icon: iconMap[item.type],
    description: item.description,
    actor: item.actor,
    timeAgo: format(new Date(item.timestamp), 'dd MMM HH:mm'),
  };
}

export function mapDashboardSparklines(data: AdminDashboardData): {
  revenuePoints: number[];
  enrollmentPoints: number[];
} {
  return {
    revenuePoints: data.revenueHistory.map((p) => p.value),
    enrollmentPoints: data.enrollmentHistory.map((p) => p.value),
  };
}
