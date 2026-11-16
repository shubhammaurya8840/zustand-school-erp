'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Users,
  CheckCircle2,
  Calendar,
  BookOpen,
  ClipboardList,
  Award,
  Clock,
  ArrowLeft,
  Loader2,
  Plus,
  AlertCircle,
  Save,
  UserCheck,
  Send,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { staffService } from '@/services/staff.service';
import { attendanceService, AttendanceStatus } from '@/services/attendance.service';
import { homeworkService } from '@/services/homework.service';
import { examService } from '@/services/exam.service';

type ActiveTab = 'roster' | 'attendance' | 'homework' | 'timetable' | 'subjects' | 'exams';

export default function ClassWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const sectionId = params.sectionId as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('roster');

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRoster, setAttendanceRoster] = useState<any[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Homework Modal state
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwSubjectId, setHwSubjectId] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwTotalMarks, setHwTotalMarks] = useState<number>(100);
  const [hwTargetType, setHwTargetType] = useState<'CLASS_SECTION' | 'INDIVIDUAL_STUDENT'>('CLASS_SECTION');
  const [hwStudentId, setHwStudentId] = useState<string>('');
  const [submittingHw, setSubmittingHw] = useState(false);
  const [hwList, setHwList] = useState<any[]>([]);

  // Marks Entry state
  const [selectedExamSchedule, setSelectedExamSchedule] = useState<any | null>(null);
  const [marksInputs, setMarksInputs] = useState<Record<string, { marks: number; remarks: string }>>({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksMsg, setMarksMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffService.getClassWorkspace(classId, sectionId);
      setWorkspace(data);
      setHwList(data.homework || []);
      if (data.subjects && data.subjects.length > 0) {
        setHwSubjectId(data.subjects[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load class workspace:', err);
      setError(err?.message || 'Unauthorized: You are not assigned to this class and section.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId && sectionId) {
      fetchWorkspace();
    }
  }, [classId, sectionId]);

  // Load attendance whenever tab is active or date changes
  useEffect(() => {
    if (activeTab === 'attendance' && classId && sectionId) {
      loadAttendanceRoster();
    }
  }, [activeTab, attendanceDate]);

  const loadAttendanceRoster = async () => {
    try {
      const data = await attendanceService.getClassAttendance(classId, sectionId, attendanceDate);
      setAttendanceRoster(data || []);
      setAttendanceMsg(null);
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
      setAttendanceMsg({ type: 'error', text: 'Failed to load attendance roster.' });
    }
  };

  const updateStudentAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  const markAllStatus = (status: AttendanceStatus) => {
    setAttendanceRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      setAttendanceMsg(null);
      const payload = {
        classId,
        sectionId,
        date: attendanceDate,
        attendanceList: attendanceRoster.map((item) => ({
          studentId: item.studentId,
          status: item.status || 'PRESENT',
          remarks: item.remarks || undefined,
        })),
      };
      const res = await attendanceService.markClassAttendance(payload);
      setAttendanceMsg({ type: 'success', text: `Saved attendance for ${res.count} students.` });
      await loadAttendanceRoster();
    } catch (err: any) {
      setAttendanceMsg({ type: 'error', text: err?.message || 'Failed to save attendance.' });
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwDescription.trim() || !hwSubjectId || !hwDueDate) {
      alert('Please fill out all required fields.');
      return;
    }
    try {
      setSubmittingHw(true);
      const payload = {
        sessionId: workspace.session?.id,
        classId,
        sectionId,
        subjectId: hwSubjectId,
        title: hwTitle,
        description: hwDescription,
        targetType: hwTargetType,
        studentId: hwTargetType === 'INDIVIDUAL_STUDENT' ? hwStudentId : undefined,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(hwDueDate).toISOString(),
        totalMarks: hwTotalMarks,
      };
      await homeworkService.create(payload);
      setShowHomeworkModal(false);
      setHwTitle('');
      setHwDescription('');
      // refresh homework
      const updated = await homeworkService.getAll({ classId, sectionId });
      setHwList(updated);
    } catch (err: any) {
      alert(err?.message || 'Failed to assign homework.');
    } finally {
      setSubmittingHw(false);
    }
  };

  const openMarksEntry = (schedule: any) => {
    setSelectedExamSchedule(schedule);
    const initial: Record<string, { marks: number; remarks: string }> = {};
    if (workspace?.students) {
      for (const s of workspace.students) {
        initial[s.id] = { marks: 0, remarks: '' };
      }
    }
    setMarksInputs(initial);
    setMarksMsg(null);
  };

  const handleSaveMarks = async () => {
    if (!selectedExamSchedule) return;
    try {
      setSavingMarks(true);
      setMarksMsg(null);
      const marksList = Object.entries(marksInputs).map(([studentId, val]) => ({
        studentId,
        marksObtained: Number(val.marks),
        remarks: val.remarks,
      }));
      const res = await examService.recordMarks({
        examScheduleId: selectedExamSchedule.id,
        marksList,
      });
      setMarksMsg({ type: 'success', text: res.message || 'Marks recorded successfully!' });
    } catch (err: any) {
      setMarksMsg({ type: 'error', text: err?.message || 'Failed to record marks.' });
    } finally {
      setSavingMarks(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="py-24 flex flex-col items-center justify-center text-navy/50 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-navy/60" />
          <p className="text-sm font-medium">Opening secure Class Workspace...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !workspace) {
    return (
      <DashboardLayout role="teacher">
        <GlassCard className="p-8 max-w-xl mx-auto text-center space-y-4 my-12 border-red-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-navy">Access Restricted</h2>
          <p className="text-sm text-navy/70">{error || 'You do not have permission to access this class workspace.'}</p>
          <Link href="/teacher/classes">
            <GlassButton className="mt-4 px-4 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Assigned Classes
            </GlassButton>
          </Link>
        </GlassCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Workspace Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-pink-900/10 border border-white/60 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link href="/teacher/classes">
              <button className="p-2 rounded-2xl bg-white/70 hover:bg-white text-navy/70 hover:text-navy transition shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-navy tracking-tight">
                  {workspace.class?.name} - Section {workspace.section?.name}
                </h1>
                {workspace.section?.isClassTeacher && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-900 border border-amber-500/30">
                    ⭐ Class Teacher
                  </span>
                )}
              </div>
              <p className="text-xs text-navy/60 mt-0.5">
                Session: {workspace.session?.name} • Room: {workspace.section?.roomNo || 'N/A'} • Enrolled:{' '}
                {workspace.students?.length || 0} students
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => {
                setActiveTab('attendance');
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Attendance</span>
            </GlassButton>
            <GlassButton
              onClick={() => {
                setActiveTab('homework');
                setShowHomeworkModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Homework</span>
            </GlassButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-navy/10">
          {[
            { id: 'roster', label: 'Class Roster', icon: Users, count: workspace.students?.length },
            { id: 'attendance', label: 'Daily Attendance', icon: CheckCircle2 },
            { id: 'homework', label: 'Homework & Tasks', icon: ClipboardList, count: hwList.length },
            { id: 'timetable', label: 'Class Timetable', icon: Clock, count: workspace.timetable?.length },
            { id: 'subjects', label: 'Assigned Subjects', icon: BookOpen, count: workspace.subjects?.length },
            { id: 'exams', label: 'Examinations & Marks', icon: Award, count: workspace.exams?.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-navy text-white shadow-md'
                    : 'bg-white/40 hover:bg-white/70 text-navy/70 border border-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-navy/10 text-navy/70'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ROSTER */}
        {activeTab === 'roster' && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-navy">Student Enrollment Roster</h3>
                <p className="text-xs text-navy/60">
                  Official list of students actively registered in {workspace.class?.name} - {workspace.section?.name}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-navy/10 text-navy">
                Total: {workspace.students?.length} Students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3 px-3">Roll No</th>
                    <th className="py-3 px-3">Admission No</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Gender</th>
                    <th className="py-3 px-3">Parent Details</th>
                    <th className="py-3 px-3">Fee Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {workspace.students?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-white/40 transition">
                      <td className="py-3 px-3 font-bold text-navy">{s.rollNo}</td>
                      <td className="py-3 px-3 font-mono font-medium text-navy/80">{s.admissionNo}</td>
                      <td className="py-3 px-3 font-semibold text-navy">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="py-3 px-3 text-navy/70 capitalize">{s.gender?.toLowerCase() || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <div className="text-navy font-medium">{s.parent?.fatherName || 'Parent'}</div>
                        <div className="text-[10px] text-navy/50">{s.parent?.primaryPhone}</div>
                      </td>
                      <td className="py-3 px-3">
                        {s.fees && s.fees.length > 0 ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.fees[0].status === 'PAID'
                                ? 'bg-emerald-500/15 text-emerald-800'
                                : s.fees[0].status === 'PARTIAL'
                                ? 'bg-amber-500/15 text-amber-800'
                                : 'bg-rose-500/15 text-rose-800'
                            }`}
                          >
                            {s.fees[0].status}
                          </span>
                        ) : (
                          <span className="text-navy/40">No dues</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!workspace.students || workspace.students.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-navy/50">
                        No students enrolled in this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <GlassCard className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy/10">
              <div>
                <h3 className="text-base font-bold text-navy">Daily Section Attendance</h3>
                <p className="text-xs text-navy/60">
                  Mark, update, and submit attendance for {workspace.class?.name} - {workspace.section?.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-white/60 bg-white/70 text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <button
                  onClick={() => markAllStatus('PRESENT')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 border border-emerald-500/20 transition"
                >
                  Mark All Present
                </button>
                <GlassButton
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                  className="px-4 py-1.5 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1.5"
                >
                  {savingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Attendance</span>
                </GlassButton>
              </div>
            </div>

            {attendanceMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  attendanceMsg.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-900 border border-rose-500/20'
                }`}
              >
                {attendanceMsg.type === 'success' ? <UserCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{attendanceMsg.text}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Admission No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {attendanceRoster.map((item) => (
                    <tr key={item.studentId} className="hover:bg-white/40 transition">
                      <td className="py-2.5 px-3 font-bold text-navy">{item.rollNo}</td>
                      <td className="py-2.5 px-3 font-mono text-navy/80">{item.admissionNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-navy">
                        {item.firstName} {item.lastName}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => updateStudentAttendance(item.studentId, st)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                                item.status === st
                                  ? st === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow'
                                    : st === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow'
                                    : st === 'LATE'
                                    ? 'bg-amber-500 text-white shadow'
                                    : 'bg-blue-600 text-white shadow'
                                  : 'bg-white/50 text-navy/60 hover:bg-white'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="Optional remarks"
                          value={item.remarks || ''}
                          onChange={(e) =>
                            setAttendanceRoster((prev) =>
                              prev.map((r) => (r.studentId === item.studentId ? { ...r, remarks: e.target.value } : r))
                            )
                          }
                          className="w-full px-2.5 py-1 rounded-lg border border-white/60 bg-white/50 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-navy/20"
                        />
                      </td>
                    </tr>
                  ))}
                  {attendanceRoster.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-navy/50">
                        No students found for this class & section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* TAB 3: HOMEWORK */}
        {activeTab === 'homework' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy">Assigned Homework & Exercises</h3>
                <p className="text-xs text-navy/60">
                  Assignments targeting {workspace.class?.name} - {workspace.section?.name}
                </p>
              </div>
              <GlassButton
                onClick={() => setShowHomeworkModal(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Assignment</span>
              </GlassButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hwList.map((hw) => (
                <GlassCard key={hw.id} className="p-5 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-800 border border-indigo-500/20">
                          {hw.subject?.name || 'Subject'}
                        </span>
                        <h4 className="text-sm font-bold text-navy mt-1.5">{hw.title}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hw.targetType === 'INDIVIDUAL_STUDENT'
                            ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30'
                        }`}
                      >
                        {hw.targetType === 'INDIVIDUAL_STUDENT'
                          ? `Individual: ${hw.student?.firstName || 'Student'}`
                          : 'Whole Class'}
                      </span>
                    </div>

                    <p className="text-xs text-navy/70 mt-2 line-clamp-3 whitespace-pre-wrap">{hw.description}</p>
                  </div>

                  <div className="pt-3 border-t border-navy/10 flex items-center justify-between text-xs text-navy/60">
                    <div>
                      <span>Due: </span>
                      <strong className="text-navy">{new Date(hw.dueDate).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span>Submissions: </span>
                      <strong className="text-navy">
                        {hw._count?.submissions ?? hw.submissions?.length ?? 0}
                      </strong>
                    </div>
                  </div>
                </GlassCard>
              ))}

              {hwList.length === 0 && (
                <GlassCard className="col-span-full p-12 text-center text-navy/50">
                  <ClipboardList className="w-10 h-10 text-navy/30 mx-auto mb-2" />
                  <p className="font-semibold text-navy">No homework assigned yet</p>
                  <p className="text-xs text-navy/60 mt-1">
                    Click &ldquo;+ Create Assignment&rdquo; to assign classwork or targeted individual homework.
                  </p>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TIMETABLE */}
        {activeTab === 'timetable' && (
          <GlassCard className="p-6">
            <h3 className="text-base font-bold text-navy mb-4">Class Weekly Timetable</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-3">Day</th>
                    <th className="py-3 px-3">Period</th>
                    <th className="py-3 px-3">Timing</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Teacher</th>
                    <th className="py-3 px-3">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {workspace.timetable?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-white/40">
                      <td className="py-3 px-3 font-bold text-navy">{p.dayOfWeek}</td>
                      <td className="py-3 px-3 font-semibold text-navy">Period {p.periodNo}</td>
                      <td className="py-3 px-3 text-navy/70">
                        {p.startTime} - {p.endTime}
                      </td>
                      <td className="py-3 px-3 font-semibold text-navy">{p.subject?.name}</td>
                      <td className="py-3 px-3 text-navy/70">
                        {p.teacher?.firstName} {p.teacher?.lastName}
                      </td>
                      <td className="py-3 px-3 font-mono text-navy/80">{p.roomNo}</td>
                    </tr>
                  ))}
                  {(!workspace.timetable || workspace.timetable.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-navy/50">
                        No timetable periods configured for this class yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* TAB 5: SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspace.subjects?.map((sub: any) => (
              <GlassCard key={sub.id} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center font-bold text-indigo-900 text-sm">
                    {sub.code?.substring(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-sm">{sub.name}</h4>
                    <p className="text-xs font-mono text-navy/50">Code: {sub.code}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-navy/10 flex items-center justify-between text-xs text-navy/60">
                  <span>Type: {sub.type || 'Mandatory'}</span>
                  <span className="font-semibold text-navy">Credit: 4.0</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* TAB 6: EXAMS & MARKS */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspace.exams?.map((exam: any) => (
                <GlassCard key={exam.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-navy text-base">{exam.name}</h4>
                      <p className="text-xs text-navy/60">Type: {exam.type}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exam.isPublished
                          ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                      }`}
                    >
                      {exam.isPublished ? 'Published' : 'Draft / Grading'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-navy/60 uppercase">Schedules & Enter Marks:</span>
                    {exam.schedules
                      ?.filter((sch: any) => sch.classId === classId)
                      .map((sch: any) => (
                        <div
                          key={sch.id}
                          className="p-3 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-navy">{sch.subject?.name}</span>
                            <div className="text-[10px] text-navy/60">
                              Max: {sch.maxMarks} • Pass: {sch.passMarks} • Date:{' '}
                              {new Date(sch.examDate).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => openMarksEntry(sch)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy text-white hover:bg-navy/90 transition shadow-sm"
                          >
                            Enter Marks
                          </button>
                        </div>
                      ))}
                  </div>
                </GlassCard>
              ))}
              {(!workspace.exams || workspace.exams.length === 0) && (
                <GlassCard className="col-span-full p-12 text-center text-navy/50">
                  <Award className="w-10 h-10 text-navy/30 mx-auto mb-2" />
                  <p className="font-semibold text-navy">No examinations scheduled</p>
                </GlassCard>
              )}
            </div>

            {/* In-Line Marks Entry Drawer/Card */}
            {selectedExamSchedule && (
              <GlassCard className="p-6 space-y-4 border-2 border-indigo-500/30">
                <div className="flex items-center justify-between pb-3 border-b border-navy/10">
                  <div>
                    <h3 className="text-base font-bold text-navy">
                      Recording Marks: {selectedExamSchedule.subject?.name}
                    </h3>
                    <p className="text-xs text-navy/60">
                      Maximum Marks: {selectedExamSchedule.maxMarks} • Passing Marks: {selectedExamSchedule.passMarks}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedExamSchedule(null)}
                    className="text-xs font-semibold text-navy/60 hover:text-navy"
                  >
                    Close Marks Entry
                  </button>
                </div>

                {marksMsg && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                      marksMsg.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/20'
                        : 'bg-rose-500/15 text-rose-900 border border-rose-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{marksMsg.text}</span>
                  </div>
                )}

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px]">
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Marks Obtained (Max: {selectedExamSchedule.maxMarks})</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {workspace.students?.map((s: any) => (
                        <tr key={s.id} className="hover:bg-white/40">
                          <td className="py-2.5 px-3 font-bold text-navy">{s.rollNo}</td>
                          <td className="py-2.5 px-3 font-semibold text-navy">
                            {s.firstName} {s.lastName}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={0}
                              max={Number(selectedExamSchedule.maxMarks)}
                              value={marksInputs[s.id]?.marks ?? 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setMarksInputs((prev) => ({
                                  ...prev,
                                  [s.id]: { marks: val, remarks: prev[s.id]?.remarks || '' },
                                }));
                              }}
                              className="w-24 px-3 py-1 rounded-xl border border-white/60 bg-white/70 text-navy font-bold focus:outline-none focus:ring-2 focus:ring-navy/20"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              placeholder="Feedback / Remarks"
                              value={marksInputs[s.id]?.remarks ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMarksInputs((prev) => ({
                                  ...prev,
                                  [s.id]: { marks: prev[s.id]?.marks ?? 0, remarks: val },
                                }));
                              }}
                              className="w-full px-3 py-1 rounded-xl border border-white/60 bg-white/70 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-navy/10">
                  <GlassButton
                    onClick={() => setSelectedExamSchedule(null)}
                    className="px-4 py-2 text-xs font-semibold bg-white text-navy/70"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={handleSaveMarks}
                    disabled={savingMarks}
                    className="px-5 py-2 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1.5"
                  >
                    {savingMarks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Official Marks</span>
                  </GlassButton>
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </div>

      {/* CREATE HOMEWORK MODAL */}
      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-navy/10">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-navy/70" />
                Assign Homework / Coursework
              </h3>
              <button
                onClick={() => setShowHomeworkModal(false)}
                className="text-navy/50 hover:text-navy text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-4">
              {/* Target Type Selector */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Assignment Target Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHwTargetType('CLASS_SECTION')}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold transition border ${
                      hwTargetType === 'CLASS_SECTION'
                        ? 'bg-navy text-white border-navy shadow'
                        : 'bg-white/50 text-navy/70 border-white/70 hover:bg-white'
                    }`}
                  >
                    Mode 1: Entire Class ({workspace.class?.name}-{workspace.section?.name})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHwTargetType('INDIVIDUAL_STUDENT');
                      if (workspace.students && workspace.students.length > 0) {
                        setHwStudentId(workspace.students[0].id);
                      }
                    }}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold transition border ${
                      hwTargetType === 'INDIVIDUAL_STUDENT'
                        ? 'bg-navy text-white border-navy shadow'
                        : 'bg-white/50 text-navy/70 border-white/70 hover:bg-white'
                    }`}
                  >
                    Mode 2: Individual Student
                  </button>
                </div>
              </div>

              {hwTargetType === 'INDIVIDUAL_STUDENT' && (
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Select Student</label>
                  <select
                    value={hwStudentId}
                    onChange={(e) => setHwStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  >
                    {workspace.students?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        Roll {s.rollNo} - {s.firstName} {s.lastName} ({s.admissionNo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Subject</label>
                <select
                  value={hwSubjectId}
                  onChange={(e) => setHwSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  required
                >
                  {workspace.subjects?.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Homework Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Quadratic Equations Problem Set"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Instructions / Description</label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed problem numbers, reference book page, and submission guidelines..."
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Due Date</label>
                  <input
                    type="date"
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={hwTotalMarks}
                    onChange={(e) => setHwTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-navy/10">
                <GlassButton
                  type="button"
                  onClick={() => setShowHomeworkModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-white text-navy/70"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  disabled={submittingHw}
                  className="px-5 py-2 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1.5"
                >
                  {submittingHw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Publish Assignment</span>
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
}

