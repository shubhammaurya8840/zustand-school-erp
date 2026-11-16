'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  X,
  Loader2,
  CheckCircle2,
  School,
  GraduationCap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { masterDataService, SubjectModel, ClassModel } from '@/services/master-data.service';
import { staffService, StaffListItem } from '@/services/staff.service';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [teachers, setTeachers] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subject Form
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    type: 'THEORY',
    isOptional: false,
  });

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    classId: '',
    teacherId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjData, classData, staffData] = await Promise.all([
        masterDataService.getSubjects(),
        masterDataService.getClasses(),
        staffService.getAll({ role: 'TEACHER', limit: 100 }),
      ]);
      setSubjects(subjData);
      setClasses(classData);
      setTeachers(staffData.staff || []);
    } catch (err: any) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      await masterDataService.createSubject({
        name: subjectForm.name,
        code: subjectForm.code.toUpperCase(),
        type: subjectForm.type,
        isOptional: subjectForm.isOptional,
      });
      setMessage({ type: 'success', text: `Subject ${subjectForm.name} created successfully!` });
      setIsAddSubjectModalOpen(false);
      setSubjectForm({ name: '', code: '', type: 'THEORY', isOptional: false });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create subject' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !assignForm.classId) return;
    try {
      setSubmitting(true);
      setMessage(null);
      await masterDataService.assignSubjectToClass({
        subjectId: selectedSubjectId,
        classId: assignForm.classId,
        teacherId: assignForm.teacherId ? assignForm.teacherId : undefined,
      });
      setMessage({ type: 'success', text: 'Subject mapped to class curriculum successfully!' });
      setIsAssignModalOpen(false);
      setAssignForm({ classId: '', teacherId: '' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to assign subject' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-navy/70" />
              Academic Curriculum & Subjects
            </h1>
            <p className="text-sm text-navy/60">
              Manage subject master, course codes, syllabus classification, and class assignments
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Subject</span>
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

        {/* Search */}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search by subject name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white/60 border border-white/60 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
        </GlassCard>

        {/* Subjects Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading curriculum subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <BookOpen className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No subjects found</p>
            <p className="text-xs text-navy/40 mt-1">Define core subjects to begin building class curricula</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((sub) => (
              <GlassCard key={sub.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 flex items-center justify-center font-bold text-navy text-sm border border-white/60">
                        {sub.code.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy text-base">{sub.name}</h3>
                        <p className="text-xs font-mono text-navy/50">Code: {sub.code}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        sub.type === 'THEORY'
                          ? 'bg-blue-500/10 text-blue-800 border-blue-500/20'
                          : sub.type === 'PRACTICAL'
                          ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-800 border-purple-500/20'
                      }`}
                    >
                      {sub.type}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/50 space-y-1.5 text-xs text-navy/70">
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Nature:</span>
                      <span className="font-medium">{sub.isOptional ? 'Elective / Optional' : 'Compulsory Core'}</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-navy/40 block mb-1">Assigned Classes:</span>
                      <div className="flex flex-wrap gap-1">
                        {sub.classSubjects && sub.classSubjects.length > 0 ? (
                          sub.classSubjects.map((cs: any) => (
                            <span
                              key={cs.id}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white/60 border border-white/80 font-medium text-navy"
                            >
                              {cs.class?.name || 'Class'}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-navy/40 italic">Not assigned to any class</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/50 flex items-center justify-end">
                  <GlassButton
                    onClick={() => {
                      setSelectedSubjectId(sub.id);
                      setIsAssignModalOpen(true);
                    }}
                    className="text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign to Class
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Add Subject Modal */}
        <AnimatePresence>
          {isAddSubjectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Add New Subject</h2>
                  </div>
                  <button onClick={() => setIsAddSubjectModalOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Subject Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Physics / English Literature"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Subject Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PHY-101 / ENG-001"
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Pedagogical Type *</label>
                    <select
                      value={subjectForm.type}
                      onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      <option value="THEORY">Theory</option>
                      <option value="PRACTICAL">Practical / Lab</option>
                      <option value="BOTH">Theory & Practical</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="optCheckbox"
                      checked={subjectForm.isOptional}
                      onChange={(e) => setSubjectForm({ ...subjectForm, isOptional: e.target.checked })}
                      className="rounded text-navy focus:ring-navy/20"
                    />
                    <label htmlFor="optCheckbox" className="text-navy/70 font-medium cursor-pointer">
                      Is Elective / Optional Subject
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAddSubjectModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Creating...' : 'Create Subject'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Assign Subject to Class Modal */}
        <AnimatePresence>
          {isAssignModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Assign Subject to Class</h2>
                  </div>
                  <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignToClass} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Target Class *</label>
                    <select
                      required
                      value={assignForm.classId}
                      onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
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
                    <label className="block text-navy/70 font-medium mb-1">Subject Teacher (Optional)</label>
                    <select
                      value={assignForm.teacherId}
                      onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      <option value="">-- Choose Assigned Teacher --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} ({t.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Assigning...' : 'Save Mapping'}
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

