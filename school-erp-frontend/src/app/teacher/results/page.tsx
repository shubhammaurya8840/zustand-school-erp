'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Save,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  School,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { examService } from '@/services/exam.service';
import { masterDataService } from '@/services/master-data.service';
import { studentService, StudentListItem } from '@/services/student.service';

export default function TeacherResultsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [marksState, setMarksState] = useState<Record<string, { marks: number; remarks: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    masterDataService
      .getAcademicSessions()
      .then((sessions) => {
        const cur = sessions.find((s) => s.isCurrent) || sessions[0];
        if (cur) return examService.getAll(cur.id);
        return [];
      })
      .then((examsData) => {
        setExams(examsData || []);
        if (examsData && examsData.length > 0) {
          setSelectedExamId(examsData[0].id);
          if (examsData[0].schedules && examsData[0].schedules.length > 0) {
            setSelectedScheduleId(examsData[0].schedules[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load exams:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const currentSchedule = currentExam?.schedules?.find((s: any) => s.id === selectedScheduleId);

  useEffect(() => {
    if (!currentSchedule?.classId) return;
    setLoading(true);
    studentService
      .getAll({ classId: currentSchedule.classId, limit: 100 })
      .then((res) => {
        const studs = res.students || [];
        setStudents(studs);
        // Initialize marks state
        const initial: Record<string, { marks: number; remarks: string }> = {};
        studs.forEach((st) => {
          initial[st.id] = { marks: 75, remarks: 'Good performance' };
        });
        setMarksState(initial);
      })
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setLoading(false));
  }, [selectedScheduleId]);

  const handleMarksChange = (studentId: string, val: number) => {
    const max = currentSchedule?.maxMarks || 100;
    const clamped = Math.max(0, Math.min(max, val));
    setMarksState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: clamped },
    }));
  };

  const handleRemarksChange = (studentId: string, val: string) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks: val },
    }));
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) return;
    try {
      setSaving(true);
      setMessage(null);
      const marksList = Object.entries(marksState).map(([studentId, data]) => ({
        studentId,
        marksObtained: Number(data.marks),
        remarks: data.remarks,
      }));

      await examService.recordMarks({
        examScheduleId: selectedScheduleId,
        marksList,
      });

      setMessage({ type: 'success', text: 'Examination marks persisted to database successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save marks' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-navy/70" />
              Teacher's Marks Entry Console
            </h1>
            <p className="text-sm text-navy/60">
              Input and commit student evaluation scores, paper grades, and qualitative feedback
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-800'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Exam & Schedule Selectors */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">Select Examination</label>
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  const ex = exams.find((x) => x.id === e.target.value);
                  if (ex?.schedules?.length > 0) {
                    setSelectedScheduleId(ex.schedules[0].id);
                  } else {
                    setSelectedScheduleId('');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">Subject Paper Schedule</label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {currentExam?.schedules && currentExam.schedules.length > 0 ? (
                  currentExam.schedules.map((sc: any) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.class?.name || 'Class'} — {sc.subject?.name || 'Subject'} (Max: {sc.maxMarks}, Pass: {sc.passMarks})
                    </option>
                  ))
                ) : (
                  <option value="">No paper schedules for this exam</option>
                )}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Marks Entry Table */}
        <form onSubmit={handleSaveMarks}>
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-navy">
                  Student Marks Roster ({students.length})
                </h3>
                {currentSchedule && (
                  <p className="text-xs text-navy/50">
                    Max Marks: {currentSchedule.maxMarks} • Minimum Passing: {currentSchedule.passMarks}
                  </p>
                )}
              </div>
              <GlassButton
                type="submit"
                disabled={saving || students.length === 0}
                className="bg-navy text-white text-xs px-4 py-2 shadow-md hover:bg-navy/90 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Marks...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save All Marks</span>
                  </>
                )}
              </GlassButton>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
                <p className="text-sm">Loading student cohort...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-navy/50">
                <p className="font-semibold text-navy">No students found or no schedule selected</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                    <tr>
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Admission No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Marks Obtained (Max {currentSchedule?.maxMarks})</th>
                      <th className="py-3 px-4">Teacher's Qualitative Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-white/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-navy/70">
                          {st.rollNo ? String(st.rollNo).padStart(2, '0') : '--'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-navy">{st.admissionNo}</td>
                        <td className="py-3 px-4 font-bold text-navy">
                          {st.firstName} {st.lastName}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max={currentSchedule?.maxMarks || 100}
                            value={marksState[st.id]?.marks ?? 0}
                            onChange={(e) => handleMarksChange(st.id, parseFloat(e.target.value) || 0)}
                            className="w-24 text-center px-2 py-1.5 rounded-xl bg-white/80 border border-navy/20 font-bold text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="e.g. Excellent analytical reasoning"
                            value={marksState[st.id]?.remarks || ''}
                            onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </form>
      </div>
    </DashboardLayout>
  );
}

