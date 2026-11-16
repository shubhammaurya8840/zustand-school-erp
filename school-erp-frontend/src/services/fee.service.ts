import { apiClient } from './api-client';

export interface FeePaymentPayload {
  studentId: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceNo?: string;
  remarks?: string;
}

export const feeService = {
  async getHeads(): Promise<any[]> {
    return apiClient.get('/fees/heads');
  },

  async getStructures(sessionId?: string, classId?: string): Promise<any[]> {
    return apiClient.get('/fees/structures', { sessionId, classId });
  },

  async createStructure(payload: {
    sessionId: string;
    classId: string;
    feeHeadId: string;
    amount: number;
    dueDate: string;
    frequency: string;
  }): Promise<any> {
    return apiClient.post('/fees/structures', payload);
  },

  async getStudentLedger(studentId: string): Promise<any> {
    return apiClient.get(`/fees/student/${studentId}`);
  },

  async collectFee(payload: FeePaymentPayload): Promise<any> {
    return apiClient.post('/fees/collect', payload);
  },

  async reversePayment(paymentId: string, reversalReason: string): Promise<any> {
    return apiClient.put(`/fees/payments/${paymentId}/reverse`, { reversalReason });
  },

  async getDefaulters(classId?: string): Promise<any[]> {
    return apiClient.get('/fees/defaulters', { classId });
  },

  async getRecentReceipts(limit = 10): Promise<any[]> {
    return apiClient.get('/fees/recent-receipts', { limit });
  },
};

