import { apiClient } from './api-client';

export interface StaffListItem {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: string;
  designation: string;
  qualification: string;
  phone: string;
  email: string;
  dob?: string | null;
  joiningDate?: string;
  department: string;
  status: string;
  user: { id: string; username: string; isActive: boolean; lastLoginAt?: string };
}

export const staffService = {
  async getAll(params?: {
    role?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; staff: StaffListItem[] }> {
    return apiClient.get('/staff', params);
  },

  async getById(id: string): Promise<any> {
    return apiClient.get(`/staff/${id}`);
  },

  async getNextEmployeeId(role?: string): Promise<{ nextEmployeeId: string; sequenceNumber: number }> {
    return apiClient.get('/staff/next-employee-id', { role });
  },

  async create(payload: {
    employeeId: string;
    firstName: string;
    lastName: string;
    role: string;
    designation: string;
    qualification: string;
    phone: string;
    email: string;
    joiningDate: string;
    department: string;
    temporaryPassword?: string;
  }): Promise<any> {
    return apiClient.post('/staff', payload);
  },

  async update(id: string, payload: Partial<StaffListItem> & { dob?: string; joiningDate?: string }): Promise<any> {
    return apiClient.put(`/staff/${id}`, payload);
  },

  async toggleStatus(id: string): Promise<any> {
    return apiClient.put(`/staff/${id}/toggle-status`);
  },

  async getMyClasses(): Promise<any[]> {
    return apiClient.get('/staff/teachers/my-classes');
  },

  async getMySubjects(): Promise<any[]> {
    return apiClient.get('/staff/teachers/my-subjects');
  },

  async getClassWorkspace(classId: string, sectionId: string): Promise<any> {
    return apiClient.get(`/staff/teachers/class-workspace/${classId}/${sectionId}`);
  },

  async getTeacherAssignments(params?: {
    teacherId?: string;
    sessionId?: string;
    classId?: string;
    sectionId?: string;
  }): Promise<any[]> {
    return apiClient.get('/staff/teachers/assignments', params);
  },

  async assignTeacher(payload: {
    teacherId: string;
    sessionId: string;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    subjectIds?: string[];
    allocations?: Array<{
      classId: string;
      sectionId: string;
      subjectId?: string;
      subjectIds?: string[];
    }>;
  }): Promise<any> {
    return apiClient.post('/staff/teachers/assignments', payload);
  },

  async updateTeacherAssignment(
    id: string,
    payload: {
      teacherId?: string;
      sessionId?: string;
      classId?: string;
      sectionId?: string;
      subjectId?: string;
    },
  ): Promise<any> {
    return apiClient.put(`/staff/teachers/assignments/${id}`, payload);
  },

  async removeTeacherAssignment(id: string): Promise<any> {
    return apiClient.delete(`/staff/teachers/assignments/${id}`);
  },
};
