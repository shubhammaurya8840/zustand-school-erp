'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  ArrowLeft,
  Award,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { AttendanceGauge } from '@/components/widgets/AttendanceGauge';
import { MiniCalendar } from '@/components/widgets/MiniCalendar';
import { studentService } from '@/services/student.service';
import { attendanceService } from '@/services/attendance.service';
import { homeworkService } from '@/services/homework.service';
import { examService } from '@/services/exam.service';
import { authService } from '@/services/auth.service';

export default function StudentDashboardPage() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Courses' | 'Schedule' | 'Students' | 'Messages' | 'Settings'>('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentService.getMe().catch(() => null),
      attendanceService.getMyAttendance().catch(() => null),
      homeworkService.getAll().catch(() => []),
      examService.getMyResults().catch(() => []),
    ]).then(([st, att, hw, res]) => {
      setStudent(st);
      setAttendance(att);
      setHomework(hw || []);
      setResults(res || []);
      setLoading(false);
    });
  }, []);

  const storedUser = authService.getStoredUser();

  const navItems = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', href: '/student/attendance', icon: CheckCircle2 },
    { name: 'Timetable', href: '/student/timetable', icon: Calendar },
    { name: 'Homework', href: '/student/homework', icon: FileText },
    { name: 'Subjects', href: '/student/subjects', icon: BookOpen },
    { name: 'Results', href: '/student/results', icon: Award },
    { name: 'Profile', href: '/student/profile', icon: Users },
  ];

  const attendancePercent = attendance?.summary?.percentage ? Number(attendance.summary.percentage) : 94;
  const avgGrade = results.length > 0 ? results[0].grade : 'A';
  const pendingHw = homework.filter((h) => !h.submissions || h.submissions.length === 0).length;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#d9e2fc] via-[#fce4ee] to-[#d6ebfc] p-3 sm:p-6 lg:p-8 flex flex-col justify-center items-center font-sans antialiased">
      {/* Top Breadcrumb & School Branding Ribbon */}
      <div className="w-full max-w-[1360px] flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/80 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Institutional Console</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Zustand Public School</span>
            <span className="text-[11px] text-slate-500">• Student Learning Space (Session 2026–2027)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/70 text-slate-700 font-semibold border border-white/80 shadow-2xs">
            Student: {student ? `${student.firstName} ${student.lastName} (${student.class?.name || ''}-${student.section?.name || ''})` : storedUser?.name || 'Student'}
          </span>
          <button
            onClick={() => authService.logout()}
            className="text-xs text-indigo-700 font-semibold hover:underline bg-white/50 px-2.5 py-1 rounded-xl border border-white/70"
          >
            Sign Out
          </button>
        </div>
      </div>

      {storedUser?.mustChangePassword && (
        <div className="w-full max-w-[1360px] mb-3 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-950 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600" />
            <span>You are currently using an initial temporary password. Please update it to secure your account.</span>
          </div>
          <Link href="/student/profile" className="underline hover:text-amber-800">
            Change Password
          </Link>
        </div>
      )}

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-[1360px] rounded-[32px] border border-white/70 bg-white/40 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(70,80,140,0.12)] p-4 sm:p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden">
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Sidebar Panel */}
        <aside
          className={`transition-all duration-300 flex flex-col justify-between shrink-0 ${
            sidebarCollapsed ? 'w-16' : 'w-56'
          }`}
        >
          <div>
            {/* Hamburger Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-10 h-10 rounded-2xl bg-white/70 hover:bg-white/95 border border-white/90 flex items-center justify-center text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8 transition-all"
              title="Toggle sidebar"
              type="button"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Navigation Menu */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.name === 'Dashboard';

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all select-none ${
                      isActive
                        ? 'bg-white/95 text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2] shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {!sidebarCollapsed && (
            <div className="pt-6 border-t border-white/60">
              <div className="text-[11px] text-slate-500 font-medium px-2">
                Zustand Public School
                <div className="text-[10px] text-slate-400">v2.0 • Liquid Glass</div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col justify-between gap-5 relative z-10">
          {/* Header Row: Title + Action Controls */}
          <header className="flex items-center justify-between pb-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
                Dashboard Overview
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Welcome back, {student?.firstName || 'Student'}! Here is your academic progress overview.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-white/90 shadow-sm flex items-center justify-center text-white font-bold text-sm">
                {student?.firstName?.[0] || 'S'}
              </div>
            </div>
          </header>

          {/* Row 1: 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              iconType="folder"
              value={student?.class?.name ? `${student.class.name}-${student.section?.name}` : 'Enrolled'}
              label="Assigned Cohort"
            />
            <MetricCard
              iconType="check"
              value={String(attendancePercent) + '%'}
              label="Attendance Rate"
            />
            <MetricCard
              iconType="refresh"
              value={String(pendingHw)}
              label="Pending Homework"
            />
            <MetricCard
              iconType="percent"
              value={avgGrade}
              label="Latest Grade"
            />
          </div>

          {/* Row 2: Enrolled Class, Attendance Overview, Assigned Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-2">
                Enrolled Academic Cohort
              </h3>
              <div className="my-auto py-2">
                <div className="text-base font-extrabold text-indigo-950">
                  {student?.class?.name || 'Class Enrolled'} {student?.section?.name ? `— Section ${student.section.name}` : ''}
                </div>
                <div className="text-xs text-slate-600 mt-1 font-mono">
                  Admission No: <span className="font-bold text-slate-800">{student?.admissionNo || 'N/A'}</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  Roll Number: <span className="font-bold text-slate-800">#{student?.rollNo || 1}</span>
                </div>
              </div>
              <Link href="/student/timetable" className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1">
                <span>View Full Timetable</span> &rarr;
              </Link>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-2">
                Attendance Compliance
              </h3>
              <div className="my-auto py-2">
                <div className="text-2xl font-black text-teal-600">{attendancePercent}%</div>
                <p className="text-xs text-slate-500 mt-1">Official term roll call register compliance</p>
              </div>
              <Link href="/student/attendance" className="text-xs font-bold text-teal-700 hover:underline inline-flex items-center gap-1">
                <span>Roll Call Details</span> &rarr;
              </Link>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-2 flex items-center justify-between">
                <span>Pending Homework</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {homework.length}
                </span>
              </h3>
              {homework.length > 0 ? (
                <div className="space-y-2 my-auto">
                  {homework.slice(0, 3).map((hw: any) => (
                    <div key={hw.id} className="p-2 rounded-xl bg-white/60 border border-white/80 text-xs">
                      <div className="font-semibold text-slate-800 truncate">{hw.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between">
                        <span>{hw.subject?.name || 'Curriculum'}</span>
                        <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="my-auto text-center py-3 text-slate-400">
                  <p className="text-xs font-semibold text-slate-600">No Pending Homework</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">All academic tasks are completed.</p>
                </div>
              )}
              <Link href="/student/homework" className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1">
                <span>Open Tasks Board</span> &rarr;
              </Link>
            </div>
          </div>

          {/* Row 3: Attendance Ring, Exam Results Overview, Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AttendanceGauge percentage={attendancePercent} />
            
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-2">
                Published Examination Grades
              </h3>
              {results.length > 0 ? (
                <div className="space-y-2 my-auto">
                  {results.slice(0, 4).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-white/50 border border-white/80 text-xs">
                      <span className="font-medium text-slate-700 truncate">{r.examSchedule?.subject?.name || 'Subject'}</span>
                      <span className="font-bold text-slate-900">{r.marksObtained} Marks ({r.grade || 'A'})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="my-auto text-center py-4 text-slate-400">
                  <p className="text-xs font-semibold text-slate-600">No Exam Results Yet</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Term assessments will appear here once officially published.</p>
                </div>
              )}
              <Link href="/student/results" className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1">
                <span>View Full Report Card</span> &rarr;
              </Link>
            </div>

            <MiniCalendar />
          </div>

          {/* Row 4: Two Announcements Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Classroom Notices
              </h3>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                Annual Examinations and Science Laboratory schedules are now posted.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Library Services
              </h3>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                Books issued from the School Central Library can be renewed at the circulation desk.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
