import { apiClient } from './api-client';

export const examService = {
  async getAll(sessionId?: string): Promise<any[]> {
    return apiClient.get('/exams', { sessionId });
  },

  async createExam(payload: {
    sessionId: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    return apiClient.post('/exams', payload);
  },

  async scheduleSubject(payload: {
    examId: string;
    classId: string;
    subjectId: string;
    examDate: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passMarks: number;
  }): Promise<any> {
    return apiClient.post('/exams/schedules', payload);
  },

  async recordMarks(payload: {
    examScheduleId: string;
    marksList: Array<{ studentId: string; marksObtained: number; remarks?: string }>;
  }): Promise<any> {
    return apiClient.post('/exams/marks', payload);
  },

  async publish(examId: string): Promise<any> {
    return apiClient.put(`/exams/${examId}/publish`);
  },

  async getReportCard(studentId: string, examId: string): Promise<any> {
    return apiClient.get(`/exams/report-card/${studentId}/${examId}`);
  },

  async getMyResults(): Promise<any[]> {
    return apiClient.get('/exams/my-results');
  },
};

