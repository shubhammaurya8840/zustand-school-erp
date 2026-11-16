import { apiClient } from './api-client';

export interface BookCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    books: number;
  };
}

export interface BookItem {
  id: string;
  isbn?: string | null;
  title: string;
  author?: string | null;
  publisher?: string | null;
  category?: string | null;
  categoryId?: string | null;
  bookCategory?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  totalCopies: number;
  availableCopies: number;
  rackLocation?: string | null;
  rackNo?: string | null;
  barcode: string;
  status?: string;
  createdAt?: string;
  issues?: any[];
}

export const libraryService = {
  // Categories
  async getCategories(params?: {
    search?: string;
    includeInactive?: boolean;
  }): Promise<BookCategory[]> {
    return apiClient.get('/library/categories', params);
  },

  async getCategoryById(id: string): Promise<BookCategory> {
    return apiClient.get(`/library/categories/${id}`);
  },

  async createCategory(payload: {
    name: string;
    description?: string;
  }): Promise<BookCategory> {
    return apiClient.post('/library/categories', payload);
  },

  async updateCategory(
    id: string,
    payload: {
      name?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<BookCategory> {
    return apiClient.put(`/library/categories/${id}`, payload);
  },

  async archiveCategory(id: string): Promise<BookCategory> {
    return apiClient.put(`/library/categories/${id}/archive`, {});
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/library/categories/${id}`);
  },

  // Books
  async getBooks(params?: {
    search?: string;
    category?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; books: BookItem[] }> {
    return apiClient.get('/library/books', params);
  },

  async getBookById(id: string): Promise<BookItem> {
    return apiClient.get(`/library/books/${id}`);
  },

  // Simplified Add Book payload: requires title, categoryId, totalCopies; rackLocation optional.
  async addBook(payload: {
    title: string;
    categoryId: string;
    totalCopies: number;
    rackLocation?: string;
    author?: string;
    isbn?: string;
    publisher?: string;
    barcode?: string;
  }): Promise<BookItem> {
    return apiClient.post('/library/books', payload);
  },

  async updateBook(id: string, payload: Partial<BookItem>): Promise<BookItem> {
    return apiClient.put(`/library/books/${id}`, payload);
  },

  async deleteBook(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/library/books/${id}`);
  },

  // Circulation
  async issueBook(payload: {
    bookId: string;
    studentId?: string;
    staffId?: string;
    loanDays: number;
  }): Promise<any> {
    return apiClient.post('/library/issue', payload);
  },

  async returnBook(
    issueId: string,
    payload: {
      fineAmount?: number;
      finePaid?: boolean;
      remarks?: string;
    },
  ): Promise<any> {
    return apiClient.put(`/library/return/${issueId}`, payload);
  },

  async getCirculation(status?: string, limit = 20): Promise<any[]> {
    return apiClient.get('/library/circulation', { status, limit });
  },

  async getOverdue(limit = 20): Promise<any[]> {
    return apiClient.get('/library/overdue', { limit });
  },
};
