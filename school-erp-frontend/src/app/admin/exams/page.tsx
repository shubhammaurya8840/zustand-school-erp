'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  BookOpen,
  Send,
  Layers,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { examService } from '@/services/exam.service';
import { masterDataService, AcademicSessionModel, ClassModel, SubjectModel } from '@/services/master-data.service';

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionModel[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Exam Form
  const [examForm, setExamForm] = useState({
    sessionId: '',
    name: '',
    type: 'HALF_YEARLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  // Schedule Subject Form
  const [schedForm, setSchedForm] = useState({
    classId: '',
    subjectId: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    maxMarks: 100,
    passMarks: 40,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessData, classData, subjData] = await Promise.all([
        masterDataService.getAcademicSessions(),
        masterDataService.getClasses(),
        masterDataService.getSubjects(),
      ]);
      setSessions(sessData);
      setClasses(classData);
      setSubjects(subjData);

      const currentSess = sessData.find((s) => s.isCurrent) || sessData[0];
      if (currentSess) {
        setExamForm((prev) => ({ ...prev, sessionId: currentSess.id }));
        const examsData = await examService.getAll(currentSess.id);
        setExams(examsData || []);
      }
    } catch (err: any) {
      console.error('Failed to load exams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      await examService.createExam({
        sessionId: examForm.sessionId,
        name: examForm.name,
        type: examForm.type,
        startDate: new Date(examForm.startDate).toISOString(),
        endDate: new Date(examForm.endDate).toISOString(),
      });
      setMessage({ type: 'success', text: `Examination period "${examForm.name}" created successfully!` });
      setIsAddExamOpen(false);
      setExamForm({
        sessionId: examForm.sessionId,
        name: '',
        type: 'HALF_YEARLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create exam' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    try {
      setSubmitting(true);
      setMessage(null);
      await examService.scheduleSubject({
        examId: selectedExamId,
        classId: schedForm.classId,
        subjectId: schedForm.subjectId,
        examDate: new Date(schedForm.examDate).toISOString(),
        startTime: schedForm.startTime,
        endTime: schedForm.endTime,
        maxMarks: Number(schedForm.maxMarks),
        passMarks: Number(schedForm.passMarks),
      });
      setMessage({ type: 'success', text: 'Subject exam schedule added successfully!' });
      setIsScheduleOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to schedule subject' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishExam = async (examId: string, name: string) => {
    try {
      await examService.publish(examId);
      setMessage({ type: 'success', text: `Exam results for "${name}" have been published to students and parents!` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to publish exam' });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-navy/70" />
              Examinations & Date Sheets
            </h1>
            <p className="text-sm text-navy/60">
              Create exam periods, schedule subject papers, manage passing thresholds, and publish results
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddExamOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Exam Period</span>
          </button>
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

        {/* Exams List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading examinations...</p>
          </div>
        ) : exams.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Award className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No examination periods created</p>
            <p className="text-xs text-navy/40 mt-1">Initialize mid-term, periodic, or annual examination schedules</p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {exams.map((ex) => (
              <GlassCard key={ex.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/60">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-navy">{ex.name}</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy/10 text-navy border border-navy/20">
                        {ex.type}
                      </span>
                      {ex.isPublished && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-navy/50 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(ex.startDate).toLocaleDateString()} – {new Date(ex.endDate).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{ex.schedules?.length || 0} Papers Scheduled</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!ex.isPublished && (
                      <GlassButton
                        onClick={() => handlePublishExam(ex.id, ex.name)}
                        className="text-xs px-3 py-1.5 flex items-center gap-1.5 text-emerald-800 bg-emerald-500/10 hover:bg-emerald-500/20"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Publish Results
                      </GlassButton>
                    )}
                    <GlassButton
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setIsScheduleOpen(true);
                      }}
                      className="text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Subject Paper
                    </GlassButton>
                  </div>
                </div>

                {/* Scheduled Papers Table */}
                {ex.schedules && ex.schedules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                        <tr>
                          <th className="py-2.5 px-3">Class</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Timing</th>
                          <th className="py-2.5 px-3 text-right">Max Marks</th>
                          <th className="py-2.5 px-3 text-right">Pass Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5">
                        {ex.schedules.map((sc: any) => (
                          <tr key={sc.id} className="hover:bg-white/30 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-navy">{sc.class?.name || 'Class'}</td>
                            <td className="py-2.5 px-3 font-medium text-navy/80">{sc.subject?.name || 'Subject'}</td>
                            <td className="py-2.5 px-3 text-navy/60">
                              {new Date(sc.examDate).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-navy/60 font-mono">
                              {sc.startTime} – {sc.endTime}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-navy">{sc.maxMarks}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{sc.passMarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-navy/40 italic py-2">No subject papers scheduled yet for this examination.</p>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        {/* Create Exam Period Modal */}
        <AnimatePresence>
          {isAddExamOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Create Exam Period</h2>
                  </div>
                  <button onClick={() => setIsAddExamOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Academic Session *</label>
                    <select
                      required
                      value={examForm.sessionId}
                      onChange={(e) => setExamForm({ ...examForm, sessionId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Exam Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mid-Term Examination 2026-27"
                      value={examForm.name}
                      onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Examination Category *</label>
                    <select
                      value={examForm.type}
                      onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 font-semibold"
                    >
                      <option value="HALF_YEARLY">Half-Yearly / Mid-Term Examination</option>
                      <option value="ANNUAL">Annual / Final Examination</option>
                      <option value="UNIT_TEST">Periodic Unit Assessment Test</option>
                      <option value="PRACTICAL">Practical Laboratory Assessment</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={examForm.startDate}
                        onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        value={examForm.endDate}
                        onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAddExamOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Creating...' : 'Create Exam'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Schedule Subject Paper Modal */}
        <AnimatePresence>
          {isScheduleOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Schedule Subject Paper</h2>
                  </div>
                  <button onClick={() => setIsScheduleOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleScheduleSubject} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Class *</label>
                    <select
                      required
                      value={schedForm.classId}
                      onChange={(e) => setSchedForm({ ...schedForm, classId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      <option value="">-- Choose Class --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Subject *</label>
                    <select
                      required
                      value={schedForm.subjectId}
                      onChange={(e) => setSchedForm({ ...schedForm, subjectId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Exam Date *</label>
                    <input
                      type="date"
                      required
                      value={schedForm.examDate}
                      onChange={(e) => setSchedForm({ ...schedForm, examDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Start Time *</label>
                      <input
                        type="time"
                        required
                        value={schedForm.startTime}
                        onChange={(e) => setSchedForm({ ...schedForm, startTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">End Time *</label>
                      <input
                        type="time"
                        required
                        value={schedForm.endTime}
                        onChange={(e) => setSchedForm({ ...schedForm, endTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Max Marks *</label>
                      <input
                        type="number"
                        required
                        min="10"
                        max="200"
                        value={schedForm.maxMarks}
                        onChange={(e) => setSchedForm({ ...schedForm, maxMarks: parseInt(e.target.value) || 100 })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Pass Marks *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="200"
                        value={schedForm.passMarks}
                        onChange={(e) => setSchedForm({ ...schedForm, passMarks: parseInt(e.target.value) || 40 })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsScheduleOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Scheduling...' : 'Add Schedule'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

