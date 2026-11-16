import { apiClient } from './api-client';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export interface RosterStudentItem {
  studentId: string;
  admissionNo: string;
  rollNo: number;
  firstName: string;
  lastName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  parentName: string | null;
  parentPhone: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
  attendanceRecordId: string | null;
}

export interface MarkAttendanceItem {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface MarkAttendancePayload {
  classId: string;
  sectionId: string;
  date: string;
  attendanceList: MarkAttendanceItem[];
}

export interface DailyAttendanceSummary {
  date: string;
  totalActiveStudents: number;
  marked: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
}

export const attendanceService = {
  async getClassAttendance(classId: string, sectionId: string, date: string): Promise<RosterStudentItem[]> {
    return apiClient.get<RosterStudentItem[]>('/attendance/class', { classId, sectionId, date });
  },

  async markClassAttendance(payload: MarkAttendancePayload): Promise<{ message: string; count: number }> {
    return apiClient.post<{ message: string; count: number }>('/attendance/class', payload);
  },

  async getStaffAttendance(date: string): Promise<any[]> {
    return apiClient.get('/attendance/staff', { date });
  },

  async markStaffAttendance(payload: {
    date: string;
    attendanceList: Array<{ staffId: string; status: string; remarks?: string }>;
  }): Promise<{ message: string; count: number }> {
    return apiClient.post('/attendance/staff', payload);
  },

  async getDailySummary(date: string): Promise<DailyAttendanceSummary> {
    return apiClient.get<DailyAttendanceSummary>('/attendance/summary', { date });
  },

  async getMyAttendance(month?: number, year?: number): Promise<any> {
    return apiClient.get('/attendance/my', { month, year });
  },

  async getStudentAttendance(studentId: string, month?: number, year?: number): Promise<any> {
    return apiClient.get(`/attendance/student/${studentId}`, { month, year });
  },
};
