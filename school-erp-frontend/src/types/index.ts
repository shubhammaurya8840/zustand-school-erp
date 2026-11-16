export type UserRole =
  | 'admin'
  | 'accountant'
  | 'teacher'
  | 'librarian'
  | 'parent'
  | 'student';

export interface UserProfile {
  name: string;
  role: UserRole;
  roleTitle: string;
  email: string;
  avatarUrl: string;
  department?: string;
  idNumber: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  iconName: string;
  iconColor: string;
  bgTint: string;
}

export interface StudentRecord {
  id: string;
  admissionNo: string;
  name: string;
  grade: string;
  section: string;
  rollNo: number;
  gender: string;
  guardianName: string;
  contact: string;
  status: 'Active' | 'Pending' | 'On Leave' | 'Alumni';
  avatar: string;
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
}

export interface FeePaymentRecord {
  id: string;
  receiptNo: string;
  studentName: string;
  grade: string;
  amount: number;
  date: string;
  method: 'Online / UPI' | 'Bank Transfer' | 'Cash' | 'Cheque';
  status: 'Completed' | 'Pending' | 'Reconciled';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  description: string;
  category: 'Academic' | 'Administrative' | 'Sports' | 'Exam' | 'Event';
  date: string;
  targetRole: string;
  important?: boolean;
}

export interface ScheduleClass {
  id: string;
  subject: string;
  grade: string;
  room: string;
  time: string;
  teacher: string;
  status: 'Upcoming' | 'Live Now' | 'Completed';
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

