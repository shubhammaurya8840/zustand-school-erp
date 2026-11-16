import { apiClient } from './api-client';

export interface AdminDashboardData {
  kpi: {
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    todayAttendancePercentage: number;
    todayPresentStudents: number;
    todayMarkedAttendance: number;
    totalFeeCollection: number;
    totalPendingDues: number;
  };
  classStrengthDistribution: Array<{
    classId: string;
    className: string;
    code: string;
    studentCount: number;
  }>;
  recentStudents: Array<{
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    joinedDate: string;
    status: string;
  }>;
  recentPayments: Array<{
    id: string;
    receiptNo: string;
    studentName: string;
    admissionNo: string;
    amount: number;
    method: string;
    date: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    priority: string;
    publishedAt: string;
  }>;
}

export const reportService = {
  async getAdminDashboard(): Promise<AdminDashboardData> {
    return apiClient.get<AdminDashboardData>('/reports/admin-dashboard');
  },

  async getAccountantDashboard(): Promise<any> {
    return apiClient.get('/reports/accountant-dashboard');
  },

  async getLibraryDashboard(): Promise<any> {
    return apiClient.get('/reports/library-dashboard');
  },

  async getSchoolSettings(): Promise<any> {
    return apiClient.get('/school-settings');
  },

  async updateSchoolSettings(payload: any): Promise<any> {
    return apiClient.patch('/school-settings', payload);
  },
};

