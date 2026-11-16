'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  CalendarCheck2,
  Clock,
  Wallet,
  FileSpreadsheet,
  BookMarked,
  Bell,
  BarChart3,
  Settings,
  Receipt,
  FileCheck,
  FolderMinus,
  Sparkles,
  BookOpen,
  Calendar,
  ClipboardList,
  Award,
  MessageSquare,
  ShieldCheck,
  PlusCircle,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  User,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const ROLE_MENUS: Record<UserRole, SidebarLink[]> = {
  admin: [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Students', href: '/admin/students', icon: Users },
    { title: 'New Admission', href: '/admin/students/admission', icon: PlusCircle, badge: 'New' },
    { title: 'Parents Registry', href: '/admin/parents', icon: UserCheck },
    { title: 'Staff Registry', href: '/admin/staff', icon: GraduationCap },
    { title: 'Teacher Allocations', href: '/admin/assignments', icon: UserCheck },
    { title: 'Classes', href: '/admin/classes', icon: Layers },
    { title: 'Subjects', href: '/admin/subjects', icon: BookOpen },
    { title: 'Attendance', href: '/admin/attendance', icon: CalendarCheck2 },
    { title: 'Timetable', href: '/admin/timetable', icon: Clock },
    { title: 'Fees & Dues', href: '/admin/fees', icon: Wallet },
    { title: 'Exams', href: '/admin/exams', icon: FileSpreadsheet },
    { title: 'Exam Results', href: '/admin/results', icon: Award },
    { title: 'Library', href: '/admin/library', icon: BookMarked },
    { title: 'Notices', href: '/admin/notices', icon: Bell },
    { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { title: 'School Settings', href: '/admin/settings', icon: Settings },
    { title: 'Admin Profile', href: '/admin/profile', icon: User },
  ],
  accountant: [
    { title: 'Dashboard', href: '/accountant/dashboard', icon: LayoutDashboard },
    { title: 'Students', href: '/accountant/students', icon: Users },
    { title: 'New Admission', href: '/accountant/students/admission', icon: PlusCircle, badge: 'New' },
    { title: 'Parents Directory', href: '/accountant/parents', icon: UserCheck },
    { title: 'Staff Registry', href: '/accountant/staff', icon: GraduationCap },
    { title: 'Fee Structures', href: '/accountant/fees', icon: Receipt },
    { title: 'Collect Fee', href: '/accountant/fees/collect', icon: Wallet, badge: 'Pay' },
    { title: 'Receipts Ledger', href: '/accountant/fees/receipts', icon: FileCheck },
    { title: 'Pending Dues', href: '/accountant/fees/dues', icon: AlertTriangle },
    { title: 'Library', href: '/accountant/library', icon: BookMarked },
    { title: 'Financial Reports', href: '/accountant/reports', icon: BarChart3 },
    { title: 'My Profile', href: '/accountant/profile', icon: User },
  ],
  teacher: [
    { title: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { title: 'My Classes', href: '/teacher/classes', icon: Layers },
    { title: 'Student Roster', href: '/teacher/students', icon: Users },
    { title: 'Roll Call Register', href: '/teacher/attendance', icon: CalendarCheck2, badge: 'Daily' },
    { title: 'My Timetable', href: '/teacher/timetable', icon: Clock },
    { title: 'Curriculum Subjects', href: '/teacher/subjects', icon: BookOpen },
    { title: 'Homework & Tasks', href: '/teacher/homework', icon: ClipboardList },
    { title: 'Exam Schedule', href: '/teacher/exams', icon: FileSpreadsheet },
    { title: 'Marks Entry', href: '/teacher/results', icon: Award },
    { title: 'School Notices', href: '/teacher/notices', icon: Bell },
    { title: 'Faculty Profile', href: '/teacher/profile', icon: User },
  ],
  librarian: [
    { title: 'Dashboard', href: '/librarian/dashboard', icon: LayoutDashboard },
    { title: 'Book Catalogue', href: '/librarian/books', icon: BookMarked },
    { title: 'Book Categories', href: '/librarian/categories', icon: Layers },
    { title: 'Add New Title', href: '/librarian/books/add', icon: PlusCircle },
    { title: 'Issue Desk', href: '/librarian/issue', icon: BookOpen },
    { title: 'Returns Desk', href: '/librarian/returns', icon: RotateCcw },
    { title: 'Overdue Tracker', href: '/librarian/overdue', icon: Clock },
    { title: 'Shelf Inventory', href: '/librarian/inventory', icon: Sparkles },
    { title: 'Member Directory', href: '/librarian/members', icon: Users },
    { title: 'Library Reports', href: '/librarian/reports', icon: BarChart3 },
    { title: 'Librarian Profile', href: '/librarian/profile', icon: User },
  ],
  parent: [
    { title: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
    { title: 'My Children', href: '/parent/children', icon: Users },
    { title: 'Attendance Record', href: '/parent/attendance', icon: CalendarCheck2 },
    { title: 'Homework & Tasks', href: '/parent/homework', icon: ClipboardList },
    { title: 'Fee Invoices', href: '/parent/fees', icon: Wallet },
    { title: 'Payment Receipts', href: '/parent/receipts', icon: Receipt },
    { title: 'Report Cards', href: '/parent/results', icon: Award },
    { title: 'Class Timetable', href: '/parent/timetable', icon: Clock },
    { title: 'School Circulars', href: '/parent/notices', icon: Bell },
    { title: 'Guardian Profile', href: '/parent/profile', icon: User },
  ],
  student: [
    { title: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { title: 'Academic Profile', href: '/student/profile', icon: User },
    { title: 'My Attendance', href: '/student/attendance', icon: CalendarCheck2 },
    { title: 'Class Timetable', href: '/student/timetable', icon: Calendar },
    { title: 'Enrolled Subjects', href: '/student/subjects', icon: BookOpen },
    { title: 'Homework & Tasks', href: '/student/homework', icon: ClipboardList },
    { title: 'Exam Date Sheet', href: '/student/exams', icon: FileSpreadsheet },
    { title: 'Grades & Results', href: '/student/results', icon: Award },
    { title: 'Notice Board', href: '/student/notices', icon: Bell },
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, isOpen, onClose }) => {
  const pathname = usePathname();
  const menuItems = ROLE_MENUS[currentRole] || ROLE_MENUS.admin;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[65px] left-0 h-screen lg:h-[calc(100vh-65px)] w-64 z-50 lg:z-30 p-3 sm:p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Frosted Panel Box */}
        <div className="glass-panel w-full h-full rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-sm">
          {/* Top Header / Role Tag */}
          <div>
            <div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-white/60">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {currentRole} Console
                </span>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-lg hover:bg-white/80 text-slate-500"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Menu List */}
            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 custom-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isExactActive = pathname === item.href;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    prefetch={false}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isExactActive
                        ? 'glass-pill-active text-slate-900 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isExactActive
                            ? 'text-indigo-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isExactActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-white/80 text-slate-500 border border-white/90'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Security / System Status Footnote */}
          <div className="pt-3 border-t border-white/60">
            <div className="p-2.5 rounded-xl bg-white/50 border border-white/70">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Single-School Edition</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Session 2026–27 • v1.0.4 Live
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
