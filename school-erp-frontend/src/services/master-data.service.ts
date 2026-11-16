import { apiClient } from './api-client';

export interface SectionModel {
  id: string;
  name: string;
  capacity: number;
  classId: string;
}

export interface ClassModel {
  id: string;
  name: string;
  numericOrder: number;
  code: string;
  stream?: string | null;
  sections: SectionModel[];
}

export type SectionItem = SectionModel;
export type ClassItem = ClassModel;

export interface AcademicSessionModel {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface SubjectModel {
  id: string;
  name: string;
  code: string;
  type: string;
  isOptional: boolean;
}

export interface LinkedChildModel {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  rollNo: number;
  status?: string;
  class?: { id?: string; name: string };
  section?: { id?: string; name: string };
}

export interface ParentModel {
  id: string;
  userId: string;
  fatherName: string;
  motherName?: string;
  guardianName?: string;
  primaryPhone: string;
  alternatePhone?: string;
  email: string;
  occupation?: string;
  address: string;
  emergencyContact: string;
  visiblePassword?: string;
  temporaryPassword?: string;
  children?: LinkedChildModel[];
  user?: {
    id: string;
    username: string;
    isActive: boolean;
    lastLoginAt?: string;
  };
}

export class MasterDataService {
  async getClasses(): Promise<ClassModel[]> {
    return apiClient.get<ClassModel[]>('/classes');
  }

  async getAcademicSessions(): Promise<AcademicSessionModel[]> {
    return apiClient.get<AcademicSessionModel[]>('/academic-sessions');
  }

  async getCurrentSession(): Promise<AcademicSessionModel> {
    return apiClient.get<AcademicSessionModel>('/academic-sessions/current');
  }

  async getSubjects(): Promise<SubjectModel[]> {
    return apiClient.get<SubjectModel[]>('/subjects');
  }

  async createClass(data: {
    name: string;
    numericOrder: number;
    code: string;
    stream?: string;
    initialSection?: string;
    initialCapacity?: number;
  }): Promise<ClassModel> {
    return apiClient.post<ClassModel>('/classes', data);
  }

  async createSection(
    classId: string,
    data: { name: string; capacity?: number },
  ): Promise<SectionModel> {
    return apiClient.post<SectionModel>(`/classes/${classId}/sections`, data);
  }

  async deleteSection(sectionId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/classes/sections/${sectionId}`);
  }

  async assignClassTeacher(sectionId: string, staffId: string): Promise<any> {
    return apiClient.put(`/classes/sections/${sectionId}/class-teacher`, { staffId });
  }

  async createSubject(data: {
    name: string;
    code: string;
    type: string;
    isOptional?: boolean;
  }): Promise<SubjectModel> {
    return apiClient.post<SubjectModel>('/subjects', data);
  }

  async assignSubjectToClass(data: {
    classId: string;
    subjectId: string;
    teacherId?: string;
  }): Promise<any> {
    return apiClient.post('/subjects/assign-class', data);
  }

  async getParents(search?: string): Promise<{ parents: ParentModel[]; total: number }> {
    return apiClient.get<{ parents: ParentModel[]; total: number }>('/parents', { search });
  }

  async getParentById(id: string): Promise<ParentModel> {
    return apiClient.get<ParentModel>(`/parents/${id}`);
  }

  async createParent(data: {
    fatherName: string;
    motherName?: string;
    guardianName?: string;
    primaryPhone: string;
    alternatePhone?: string;
    email: string;
    occupation?: string;
    address: string;
    emergencyContact: string;
    temporaryPassword?: string;
    parentPassword?: string;
  }): Promise<ParentModel & { credentials?: { username: string; temporaryPassword?: string } }> {
    return apiClient.post('/parents', data);
  }

  async updateParent(id: string, data: Partial<ParentModel>): Promise<ParentModel> {
    return apiClient.patch<ParentModel>(`/parents/${id}`, data);
  }

  async deleteParent(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/parents/${id}`);
  }

  async getSchoolSettings(): Promise<any> {
    return apiClient.get<any>('/school-settings');
  }

  async updateSchoolSettings(payload: any): Promise<any> {
    return apiClient.patch('/school-settings', payload);
  }
}

export const masterDataService = new MasterDataService();

