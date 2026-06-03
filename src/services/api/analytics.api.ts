import { httpClient } from './axios.instance';

export interface DateRangeParams {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface StudentAnalytics {
  attendance: {
    rate: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    trend: Array<{ date: string; rate: number }>;
  };
  grades: {
    average: number;
    highest: number;
    lowest: number;
    trend: Array<{ date: string; score: number }>;
  };
  progress: {
    coursesEnrolled: number;
    coursesCompleted: number;
    overallProgress: number;
  };
  payments: {
    totalPaid: number;
    totalOwed: number;
    currency: string;
  };
}

export interface TeacherAnalyticsSummary {
  totalStudents: number;
  activeCourses: number;
  averageAttendance: number;
  averageGrade: number;
  homeworkGraded: number;
  homeworkPending: number;
  attendanceTrend: Array<{ date: string; rate: number }>;
  gradeTrend: Array<{ date: string; average: number }>;
}

export interface AdminAnalytics {
  revenue: {
    total: number;
    monthly: number;
    currency: string;
    trend: Array<{ month: string; amount: number }>;
    byCategory: Array<{ name: string; amount: number }>;
  };
  students: {
    total: number;
    active: number;
    new: number;
    growth: Array<{ month: string; count: number }>;
  };
  courses: {
    total: number;
    active: number;
    averageCompletion: number;
    topCourses: Array<{ id: string; name: string; studentCount: number }>;
  };
  attendance: {
    rate: number;
    trend: Array<{ date: string; rate: number }>;
  };
}

export interface OwnerAnalytics {
  tenants: {
    total: number;
    active: number;
    byPlan: Record<string, number>;
    growth: Array<{ month: string; count: number }>;
  };
  revenue: {
    mrr: number;
    arr: number;
    currency: string;
    trend: Array<{ month: string; amount: number }>;
    byTenant: Array<{ tenantId: string; name: string; amount: number }>;
  };
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
    growth: Array<{ month: string; count: number }>;
  };
  retention: {
    rate: number;
    churn: number;
    trend: Array<{ month: string; rate: number }>;
  };
}

export const analyticsApi = {
  getStudentAnalytics: async (
    studentId: string,
    params?: DateRangeParams,
  ): Promise<StudentAnalytics> => {
    const { data } = await httpClient.get<StudentAnalytics>(
      `/analytics/students/${studentId}`,
      { params },
    );
    return data;
  },

  getTeacherAnalytics: async (
    teacherId: string,
    params?: DateRangeParams,
  ): Promise<TeacherAnalyticsSummary> => {
    const { data } = await httpClient.get<TeacherAnalyticsSummary>(
      `/analytics/teachers/${teacherId}`,
      { params },
    );
    return data;
  },

  getAdminAnalytics: async (params?: DateRangeParams): Promise<AdminAnalytics> => {
    const { data } = await httpClient.get<AdminAnalytics>(
      '/analytics/admin',
      { params },
    );
    return data;
  },

  getOwnerAnalytics: async (params?: DateRangeParams): Promise<OwnerAnalytics> => {
    const { data } = await httpClient.get<OwnerAnalytics>(
      '/analytics/owner',
      { params },
    );
    return data;
  },

  getCourseAnalytics: async (
    courseId: string,
    params?: DateRangeParams,
  ): Promise<{
    enrollmentCount: number;
    completionRate: number;
    averageGrade: number;
    attendanceRate: number;
    trend: Array<{ date: string; value: number }>;
  }> => {
    const { data } = await httpClient.get<{
      enrollmentCount: number;
      completionRate: number;
      averageGrade: number;
      attendanceRate: number;
      trend: Array<{ date: string; value: number }>;
    }>(`/analytics/courses/${courseId}`, { params });
    return data;
  },
};
