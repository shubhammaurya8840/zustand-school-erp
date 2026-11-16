import { apiClient } from './api-client';

export interface TimetablePeriodItem {
  id: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  periodNo: number;
  startTime: string;
  endTime: string;
  roomNo: string;
  subject?: { id: string; name: string; code: string };
  teacher?: { id: string; firstName: string; lastName: string; employeeId: string };
  class?: { id: string; name: string; code: string };
  section?: { id: string; name: string };
}

export const timetableService = {
  async getClassTimetable(params: {
    sessionId?: string;
    classId: string;
    sectionId: string;
  }): Promise<TimetablePeriodItem[]> {
    return apiClient.get<TimetablePeriodItem[]>('/timetable/class', params);
  },

  async getTeacherTimetable(
    teacherId: string,
    sessionId?: string,
  ): Promise<TimetablePeriodItem[]> {
    return apiClient.get<TimetablePeriodItem[]>(`/timetable/teacher/${teacherId}`, { sessionId });
  },

  async createPeriod(payload: {
    sessionId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: string;
    periodNo: number;
    startTime: string;
    endTime: string;
    roomNo: string;
  }): Promise<TimetablePeriodItem> {
    return apiClient.post<TimetablePeriodItem>('/timetable/periods', payload);
  },

  async deletePeriod(id: string): Promise<any> {
    return apiClient.delete(`/timetable/periods/${id}`);
  },

  async getMyClassTimetable(): Promise<TimetablePeriodItem[]> {
    return apiClient.get<TimetablePeriodItem[]>('/timetable/my-class');
  },

  async getMyTeacherSchedule(): Promise<TimetablePeriodItem[]> {
    return apiClient.get<TimetablePeriodItem[]>('/timetable/my-schedule');
  },
};

