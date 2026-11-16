import { apiClient } from './api-client';

export interface HomeworkSubmissionItem {
  id: string;
  homeworkId: string;
  studentId: string;
  submissionText: string;
  attachmentUrl?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED' | 'REJECTED';
  marksAwarded?: number;
  feedback?: string;
  evaluatedAt?: string;
  student?: {
    id: string;
    admissionNo: string;
    rollNo: number;
    firstName: string;
    lastName: string;
  };
}

export interface HomeworkItem {
  id: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  targetType: 'CLASS_SECTION' | 'INDIVIDUAL_STUDENT';
  studentId?: string;
  assignedDate: string;
  dueDate: string;
  totalMarks?: number;
  createdAt: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  subject?: { id: string; name: string; code: string };
  teacher?: { id: string; firstName: string; lastName: string; employeeId: string };
  student?: { id: string; firstName: string; lastName: string; admissionNo: string; rollNo: number };
  submissions?: HomeworkSubmissionItem[];
  _count?: { submissions: number };
}

export const homeworkService = {
  async getAll(params?: {
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    teacherId?: string;
    studentId?: string;
  }): Promise<HomeworkItem[]> {
    return apiClient.get<HomeworkItem[]>('/homework', params);
  },

  async getById(id: string): Promise<HomeworkItem> {
    return apiClient.get<HomeworkItem>(`/homework/${id}`);
  },

  async create(payload: {
    sessionId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    title: string;
    description: string;
    targetType: 'CLASS_SECTION' | 'INDIVIDUAL_STUDENT';
    studentId?: string;
    assignedDate: string;
    dueDate: string;
    totalMarks?: number;
  }): Promise<HomeworkItem> {
    return apiClient.post<HomeworkItem>('/homework', payload);
  },

  async submit(
    homeworkId: string,
    payload: { submissionText: string; attachmentUrl?: string },
  ): Promise<HomeworkSubmissionItem> {
    return apiClient.post<HomeworkSubmissionItem>(`/homework/${homeworkId}/submit`, payload);
  },

  async evaluateSubmission(
    submissionId: string,
    payload: { status: 'GRADED' | 'REJECTED' | 'SUBMITTED'; marksAwarded?: number; feedback?: string },
  ): Promise<HomeworkSubmissionItem> {
    return apiClient.put<HomeworkSubmissionItem>(`/homework/submissions/${submissionId}/evaluate`, payload);
  },
};

