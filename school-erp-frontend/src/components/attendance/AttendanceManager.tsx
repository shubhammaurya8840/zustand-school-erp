'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/common/GlassCard';
import {
  CalendarCheck2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
  Save,
  CheckCheck,
  UserX,
  Filter,
  Calendar as CalendarIcon,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  attendanceService,
  RosterStudentItem,
  AttendanceStatus,
} from '@/services/attendance.service';
import { masterDataService, ClassItem, SectionItem } from '@/services/master-data.service';
import { staffService } from '@/services/staff.service';
import { authService } from '@/services/auth.service';

interface AttendanceManagerProps {
  currentRole: 'teacher' | 'admin';
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ currentRole }) => {
  const router = useRouter();

  // Authentication & authorization check
  useEffect(() => {
    const user = authService.getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const role = user.role;
    if (currentRole === 'teacher' && role !== 'TEACHER' && role !== 'SCHOOL_ADMIN') {
      router.push(user.targetDashboard || '/login');
    }
    if (currentRole === 'admin' && role !== 'SCHOOL_ADMIN') {
      router.push(user.targetDashboard || '/login');
    }
  }, [currentRole, router]);

  // Master Data & Selection States
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Roster & Attendance State
  const [roster, setRoster] = useState<RosterStudentItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [alreadyMarked, setAlreadyMarked] = useState<boolean>(false);

  // UI States
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial Load: Fetch Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);

        if (currentRole === 'teacher') {
          const assigned = await staffService.getMyClasses();
          const map = new Map<string, ClassItem>();
          for (const item of assigned) {
            if (!map.has(item.classId)) {
              map.set(item.classId, {
                id: item.classId,
                name: item.className,
                code: '',
                numericOrder: 0,
                sections: [],
              } as any);
            }
            const cls = map.get(item.classId)!;
            if (!cls.sections.some((s: any) => s.id === item.sectionId)) {
              cls.sections.push({
                id: item.sectionId,
                name: item.sectionName,
                classId: item.classId,
              } as any);
            }
          }
          const classList = Array.from(map.values());
          setClasses(classList);

          if (classList.length > 0) {
            setSelectedClassId(classList[0].id);
            if (classList[0].sections.length > 0) {
              setSelectedSectionId(classList[0].sections[0].id);
            }
          }
        } else {
          const data = await masterDataService.getClasses();
          setClasses(data);

          if (data.length > 0) {
            const targetClass =
              data.find((c) => c.name === 'Class 10' || c.code === 'C10') || data[0];
            setSelectedClassId(targetClass.id);

            const secA =
              targetClass.sections.find((s: SectionItem) => s.name === 'A') || targetClass.sections[0];
            if (secA) {
              setSelectedSectionId(secA.id);
            }
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load class list.');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [currentRole]);

  // Sections of currently selected class
  const activeSections: SectionItem[] = useMemo(() => {
    const c = classes.find((cls) => cls.id === selectedClassId);
    return c?.sections || [];
  }, [classes, selectedClassId]);

  // When class changes, ensure sectionId is updated to a valid section in that class
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSuccessMessage(null);
    setErrorMessage(null);

    const c = classes.find((cls) => cls.id === newClassId);
    if (c && c.sections && c.sections.length > 0) {
      // Prefer Section A
      const secA = c.sections.find((s: SectionItem) => s.name === 'A') || c.sections[0];
      setSelectedSectionId(secA.id);
    } else {
      setSelectedSectionId('');
    }
  };

  // 2. Fetch Attendance Roster whenever class, section, or date changes
  const fetchRoster = useCallback(async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) return;

    try {
      setLoadingRoster(true);
      setErrorMessage(null);

      const items = await attendanceService.getClassAttendance(
        selectedClassId,
        selectedSectionId,
        selectedDate,
      );

      // Verify that every student returned strictly matches the selected class and section
      const strictlyFiltered = items.filter(
        (s) => s.classId === selectedClassId && s.sectionId === selectedSectionId,
      );

      setRoster(strictlyFiltered);

      // Build local attendance state
      const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
      let isMarked = false;

      for (const s of strictlyFiltered) {
        if (s.status) {
          isMarked = true;
          initialMap[s.studentId] = {
            status: s.status,
            remarks: s.remarks || '',
          };
        } else {
          // Default unmarked students to PRESENT
          initialMap[s.studentId] = {
            status: 'PRESENT',
            remarks: '',
          };
        }
      }

      setAttendanceRecords(initialMap);
      setAlreadyMarked(isMarked);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load attendance roster.');
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedClassId, selectedSectionId, selectedDate]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  // Handle single student status toggle
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || '',
      },
    }));
    setSuccessMessage(null);
  };

  // Handle remarks change
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'PRESENT',
        remarks,
      },
    }));
  };

  // Batch action: Mark all present
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    for (const s of roster) {
      updated[s.studentId] = {
        status,
        remarks: attendanceRecords[s.studentId]?.remarks || '',
      };
    }
    setAttendanceRecords(updated);
    setSuccessMessage(null);
  };

  // Submit attendance to backend
  const handleSubmitAttendance = async () => {
    if (!selectedClassId || !selectedSectionId || roster.length === 0) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Verify that every student to be submitted belongs strictly to the selected class & section
      const payloadItems = roster.map((s) => ({
        studentId: s.studentId,
        status: attendanceRecords[s.studentId]?.status || 'PRESENT',
        remarks: attendanceRecords[s.studentId]?.remarks || undefined,
      }));

      const res = await attendanceService.markClassAttendance({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: selectedDate,
        attendanceList: payloadItems,
      });

      setSuccessMessage(res.message || 'Attendance records successfully committed to PostgreSQL database.');
      setAlreadyMarked(true);

      // Refresh roster to load generated record IDs
      await fetchRoster();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit attendance records.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter roster by search term
  const displayedRoster = useMemo(() => {
    if (!searchQuery.trim()) return roster;
    const q = searchQuery.toLowerCase().trim();
    return roster.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        String(s.rollNo).includes(q),
    );
  }, [roster, searchQuery]);

  // Real-time Summary Counters
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    for (const s of roster) {
      const st = attendanceRecords[s.studentId]?.status;
      if (st === 'PRESENT') present++;
      else if (st === 'ABSENT') absent++;
      else if (st === 'LATE') late++;
      else if (st === 'LEAVE') leave++;
    }

    const total = roster.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, leave, rate };
  }, [roster, attendanceRecords]);

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Class';
  const selectedSectionName = activeSections.find((s) => s.id === selectedSectionId)?.name || 'A';

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <GlassCard padding="lg" className="border-white/80 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs">
              <Filter className="w-3.5 h-3.5" />
              <span>Section Filter</span>
            </div>

            {/* Class Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={loadingClasses || loadingRoster}
                className="px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.stream ? `(${cls.stream})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                disabled={loadingClasses || loadingRoster || activeSections.length === 0}
                className="px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {activeSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Roll Call Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSuccessMessage(null);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-white/80 border border-white/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick Refresh & Status indicator */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <button
              onClick={() => fetchRoster()}
              disabled={loadingRoster}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all disabled:opacity-50"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRoster ? 'animate-spin' : ''}`} />
              <span>Refresh Roster</span>
            </button>

            {alreadyMarked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Submitted</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-2xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Roll Call</span>
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Real-Time Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <GlassCard padding="sm" className="border-white/80 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Enrolled Students</div>
          <div className="text-xl font-black text-slate-800 mt-0.5">{summary.total}</div>
          <div className="text-[10px] text-slate-500 font-medium">In {selectedClassName}-{selectedSectionName}</div>
        </GlassCard>

        <GlassCard padding="sm" className="border-emerald-200 bg-emerald-50/50 text-center">
          <div className="text-[10px] font-bold text-emerald-600 uppercase">Present</div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{summary.present}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">{summary.rate}% Attendance</div>
        </GlassCard>

        <GlassCard padding="sm" className="border-rose-200 bg-rose-50/50 text-center">
          <div className="text-[10px] font-bold text-rose-600 uppercase">Absent</div>
          <div className="text-xl font-black text-rose-700 mt-0.5">{summary.absent}</div>
          <div className="text-[10px] text-rose-600 font-medium">Without notice</div>
        </GlassCard>

        <GlassCard padding="sm" className="border-amber-200 bg-amber-50/50 text-center">
          <div className="text-[10px] font-bold text-amber-600 uppercase">Late Entry</div>
          <div className="text-xl font-black text-amber-700 mt-0.5">{summary.late}</div>
          <div className="text-[10px] text-amber-600 font-medium">Delayed arrivals</div>
        </GlassCard>

        <GlassCard padding="sm" className="border-sky-200 bg-sky-50/50 text-center">
          <div className="text-[10px] font-bold text-sky-600 uppercase">Sanctioned Leave</div>
          <div className="text-xl font-black text-sky-700 mt-0.5">{summary.leave}</div>
          <div className="text-[10px] text-sky-600 font-medium">Approved requests</div>
        </GlassCard>

        <GlassCard padding="sm" className="border-indigo-200 bg-indigo-50/50 flex flex-col justify-center items-center">
          <button
            onClick={handleSubmitAttendance}
            disabled={submitting || loadingRoster || roster.length === 0}
            className="w-full h-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-1 group"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px]">Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px]">Save Attendance</span>
              </>
            )}
          </button>
        </GlassCard>
      </div>

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 hover:text-rose-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Student Roster Table Card */}
      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        {/* Table Subheader & Batch Controls */}
        <div className="p-4 border-b border-white/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/40">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              {selectedClassName} – Section {selectedSectionName} Roll Call Register
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Institutional register strictly filtered by database foreign keys • Date: {selectedDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white/70 border border-white/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
              />
            </div>

            {/* Quick Batch Buttons */}
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              disabled={loadingRoster || roster.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all disabled:opacity-50"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              disabled={loadingRoster || roster.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all disabled:opacity-50"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loadingRoster ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading class roster from database...</p>
          </div>
        ) : displayedRoster.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-3 shadow-2xs">
              <UserX className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No students enrolled in {selectedClassName} – Section {selectedSectionName}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Select another class (such as Class 10 – Section A) from the filter dropdown above to view and record student attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-14 text-center">Roll</th>
                  <th className="py-3 px-4">Student & Admission</th>
                  <th className="py-3 px-4">Enrolled Class</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Remarks / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {displayedRoster.map((student) => {
                  const currentStatus = attendanceRecords[student.studentId]?.status || 'PRESENT';
                  const currentRemarks = attendanceRecords[student.studentId]?.remarks || '';

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-white/40 transition-colors"
                    >
                      {/* Roll Number */}
                      <td className="py-3 px-4 text-center font-black text-slate-800 font-mono">
                        #{student.rollNo}
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {student.admissionNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Enrolled Class (Verified Foreign Key) */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 border border-white text-slate-700 font-semibold text-[11px] shadow-2xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{student.className} – {student.sectionName}</span>
                        </span>
                      </td>

                      {/* Guardian Contact */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">
                          {student.parentName || 'Guardian'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {student.parentPhone || 'N/A'}
                        </div>
                      </td>

                      {/* Status Selector Pill Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>P</span>
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs scale-105'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            <XCircle className="w-3 h-3" />
                            <span>A</span>
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'LATE')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-xs scale-105'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>L</span>
                          </button>

                          {/* Leave */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, 'LEAVE')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === 'LEAVE'
                                ? 'bg-sky-500 text-white shadow-xs scale-105'
                                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            <span>Lv</span>
                          </button>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional note..."
                          value={currentRemarks}
                          onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                          className="w-full px-2.5 py-1 bg-white/60 focus:bg-white border border-white/80 focus:border-indigo-400 rounded-lg text-xs text-slate-700 focus:outline-none shadow-2xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        {displayedRoster.length > 0 && (
          <div className="p-4 border-t border-white/60 bg-white/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800">{displayedRoster.length}</span> students enrolled in {selectedClassName}-{selectedSectionName}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={submitting || loadingRoster}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Submit {selectedClassName}-{selectedSectionName} Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

