import { apiClient } from './api-client';

export interface StudentListItem {
  id: string;
  admissionNo: string;
  rollNo: number;
  firstName: string;
  lastName: string;
  gender?: string;
  status?: string;
  classId?: string;
  sectionId?: string;
  class: { id: string; name: string; code: string };
  section: { id: string; name: string };
  parent: { id: string; fatherName: string; motherName?: string; primaryPhone: string; email: string };
  fees: Array<{
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
  }>;
}

export interface StudentAdmissionPayload {
  admissionNo: string;
  rollNo: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup?: string;
  address: string;
  emergencyContact: string;
  classId: string;
  sectionId: string;
  parentId: string;
  studentPassword?: string;
}

export interface StudentUpdatePayload {
  rollNo?: number;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  status?: string;
  classId?: string;
  sectionId?: string;
  totalFee?: number;
  discountAmount?: number;
}

export const studentService = {
  async getAll(params?: {
    classId?: string;
    sectionId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; students: StudentListItem[] }> {
    return apiClient.get('/students', params);
  },

  async getById(id: string): Promise<any> {
    return apiClient.get(`/students/${id}`);
  },

  async admit(payload: StudentAdmissionPayload): Promise<any> {
    return apiClient.post('/students/admit', payload);
  },

  async update(id: string, payload: StudentUpdatePayload): Promise<any> {
    return apiClient.put(`/students/${id}`, payload);
  },

  async getMyChildren(): Promise<any[]> {
    return apiClient.get('/parents/my-children');
  },

  async getMe(): Promise<any> {
    return apiClient.get('/students/me');
  },

  async resetPassword(id: string, newPassword?: string): Promise<{ message: string; temporaryPassword?: string; username?: string }> {
    return apiClient.post(`/students/${id}/reset-password`, { newPassword });
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/students/${id}`);
  },
};

