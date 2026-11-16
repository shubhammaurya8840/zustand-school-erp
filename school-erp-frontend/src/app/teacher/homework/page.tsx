'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  BookOpen,
  School,
  AlertCircle,
  Users,
  Send,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { homeworkService, HomeworkItem } from '@/services/homework.service';
import { staffService } from '@/services/staff.service';
import { studentService } from '@/services/student.service';

export default function TeacherHomeworkPage() {
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [targetType, setTargetType] = useState<'CLASS_SECTION' | 'INDIVIDUAL_STUDENT'>('CLASS_SECTION');
  const [selectedCohort, setSelectedCohort] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [cohortStudents, setCohortStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, hwData] = await Promise.all([
        staffService.getMyClasses(),
        homeworkService.getAll(),
      ]);
      setAssignedClasses(classesData || []);
      setHomeworkList(hwData || []);

      if (classesData && classesData.length > 0) {
        const first = classesData[0];
        const cohortKey = `${first.classId}___${first.sectionId}`;
        setSelectedCohort(cohortKey);
        if (first.subjects && first.subjects.length > 0) {
          setSelectedSubjectId(first.subjects[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load homework data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !selectedCohort || !selectedSubjectId || !dueDate) {
      setMessage({ type: 'error', text: 'Please fill out all required fields.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const [cId, sId] = selectedCohort.split('___');
      const payload = {
        sessionId: '', // backend will resolve or use active session
        classId: cId,
        sectionId: sId,
        subjectId: selectedSubjectId,
        title,
        description,
        targetType,
        studentId: targetType === 'INDIVIDUAL_STUDENT' ? selectedStudentId : undefined,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        totalMarks,
      };

      await homeworkService.create(payload as any);
      setMessage({
        type: 'success',
        text: 'Homework assignment successfully published to PostgreSQL database!',
      });
      setIsAddOpen(false);
      setTitle('');
      setDescription('');
      // Reload list
      const updated = await homeworkService.getAll();
      setHomeworkList(updated || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create homework.' });
    } finally {
      setSubmitting(false);
    }
  };

  const activeCohortObj = assignedClasses.find(
    (ac) => `${ac.classId}___${ac.sectionId}` === selectedCohort
  );

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-navy/70" />
              Homework & Coursework Management
            </h1>
            <p className="text-sm text-navy/60">
              Publish class-wide assignments or individualized coursework with deadline tracking
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Assign Homework</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-900 border border-rose-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Homework List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading homework assignments...</p>
          </div>
        ) : homeworkList.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <FileText className="w-12 h-12 text-navy/30 mx-auto mb-3" />
            <p className="font-semibold text-navy text-base">No Homework Found</p>
            <p className="text-xs text-navy/60 mt-1 max-w-sm mx-auto">
              You haven&apos;t created any homework assignments yet. Click &ldquo;+ Assign Homework&rdquo; to publish work for your
              students.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {homeworkList.map((hw) => (
              <GlassCard
                key={hw.id}
                className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border border-white/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-900 border border-indigo-500/20">
                      {hw.subject?.name || 'Subject'}
                    </span>
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

                  <h3 className="font-bold text-navy text-sm leading-snug">{hw.title}</h3>
                  <div className="text-[11px] text-navy/50 mt-0.5 font-medium">
                    {hw.class?.name} - {hw.section?.name}
                  </div>

                  <p className="text-xs text-navy/70 mt-3 line-clamp-3 whitespace-pre-wrap">{hw.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy/10 flex items-center justify-between text-xs text-navy/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-navy/40" />
                    <span>Due: </span>
                    <strong className="text-navy">{new Date(hw.dueDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-navy/50">Submissions: </span>
                    <strong className="text-navy font-bold">{hw._count?.submissions ?? hw.submissions?.length ?? 0}</strong>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Modal: Create Homework */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassCard className="max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-navy/10">
                <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                  <FileText className="w-5 h-5 text-navy/70" />
                  Assign Homework / Exercise
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="text-navy/50 hover:text-navy text-sm font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Cohort Selector */}
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Select Assigned Cohort</label>
                  <select
                    value={selectedCohort}
                    onChange={(e) => setSelectedCohort(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  >
                    {assignedClasses.map((ac) => (
                      <option key={`${ac.classId}-${ac.sectionId}`} value={`${ac.classId}___${ac.sectionId}`}>
                        {ac.className} - Section {ac.sectionName} ({ac.studentCount} students)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">Assignment Scope Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetType('CLASS_SECTION')}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold transition border ${
                        targetType === 'CLASS_SECTION'
                          ? 'bg-navy text-white border-navy shadow'
                          : 'bg-white/50 text-navy/70 border-white/70 hover:bg-white'
                      }`}
                    >
                      Mode 1: Entire Class
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('INDIVIDUAL_STUDENT')}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold transition border ${
                        targetType === 'INDIVIDUAL_STUDENT'
                          ? 'bg-navy text-white border-navy shadow'
                          : 'bg-white/50 text-navy/70 border-white/70 hover:bg-white'
                      }`}
                    >
                      Mode 2: Individual Student
                    </button>
                  </div>
                </div>

                {/* Individual Student Picker if Mode 2 */}
                {targetType === 'INDIVIDUAL_STUDENT' && (
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Target Student</label>
                    {loadingStudents ? (
                      <div className="flex items-center gap-2 text-xs text-navy/50 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading cohort students...
                      </div>
                    ) : (
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                        required
                      >
                        {cohortStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            Roll {s.rollNo} - {s.firstName} {s.lastName} ({s.admissionNo})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Subject Picker */}
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  >
                    {activeCohortObj?.subjects?.map((sub: any) => (
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
                    placeholder="e.g. Quadratic Formula Worksheet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Task Instructions</label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed instructions, textbook questions, and submission requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
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
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-navy/10">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-400" />}
                    <span>Publish Homework</span>
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
