import { apiClient } from './api-client';

export interface UserSession {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'SCHOOL_ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'LIBRARIAN' | 'PARENT' | 'STUDENT';
  targetDashboard: string;
  mustChangePassword?: boolean;
  admissionNo?: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: UserSession;
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>('/auth/login', {
      identifier: identifier.trim(),
      password,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('zustand_erp_token', data.accessToken);
      localStorage.setItem('zustand_erp_user', JSON.stringify(data.user));
    }

    return data;
  },

  async getProfile(): Promise<any> {
    return apiClient.get('/auth/profile');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  async requestPasswordReset(email: string): Promise<any> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<any> {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zustand_erp_token');
      localStorage.removeItem('zustand_erp_user');
      window.location.href = '/login';
    }
  },

  getStoredUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('zustand_erp_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('zustand_erp_token');
  },
};

