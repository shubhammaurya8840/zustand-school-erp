'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  School,
  BookOpen,
  Calendar,
  Edit3,
  Layers,
  Save,
  CheckSquare,
  Square,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { staffService } from '@/services/staff.service';
import { masterDataService, ClassModel, SectionModel, SubjectModel } from '@/services/master-data.service';

export default function AdminTeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');

  // Allocation Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allocationMode, setAllocationMode] = useState<'single' | 'multiple'>('single');

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  // Single mode state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Multiple mode state (array of `${classId}::${sectionId}`)
  const [selectedCohortKeys, setSelectedCohortKeys] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Edit Assignment Modal State
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editSectionId, setEditSectionId] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignList, staffList, sessionList, classList, subjectList] = await Promise.all([
        staffService.getTeacherAssignments(),
        staffService.getAll({ role: 'TEACHER', limit: 150 }),
        masterDataService.getAcademicSessions(),
        masterDataService.getClasses(),
        masterDataService.getSubjects(),
      ]);

      setAssignments(assignList || []);
      setTeachers(staffList?.staff || []);
      setSessions(sessionList || []);
      setClasses(classList || []);
      setSubjects(subjectList || []);

      if (staffList?.staff?.length > 0) setSelectedTeacherId(staffList.staff[0].id);
      const currentSession = sessionList.find((s: any) => s.isCurrent) || sessionList[0];
      if (currentSession) setSelectedSessionId(currentSession.id);

      if (classList?.length > 0) {
        setSelectedClassId(classList[0].id);
        if (classList[0].sections && classList[0].sections.length > 0) {
          setSelectedSectionId(classList[0].sections[0].id);
        }
      }
      if (subjectList?.length > 0) {
        setSelectedSubjectId(subjectList[0].id);
        setSelectedSubjectIds([subjectList[0].id]);
      }
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls && cls.sections && cls.sections.length > 0) {
      setSelectedSectionId(cls.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const toggleCohortSelection = (cohortKey: string) => {
    setSelectedCohortKeys((prev) =>
      prev.includes(cohortKey) ? prev.filter((k) => k !== cohortKey) : [...prev, cohortKey]
    );
  };

  const toggleSubjectSelection = (subId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const selectAllCohorts = () => {
    const allKeys: string[] = [];
    classes.forEach((c) => {
      c.sections?.forEach((s) => {
        allKeys.push(`${c.id}::${s.id}`);
      });
    });
    if (selectedCohortKeys.length === allKeys.length) {
      setSelectedCohortKeys([]);
    } else {
      setSelectedCohortKeys(allKeys);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSessionId) {
      setMsg({ type: 'error', text: 'Teacher and Academic Session are required.' });
      return;
    }

    try {
      setSubmitting(true);
      setMsg(null);

      if (allocationMode === 'multiple') {
        if (selectedCohortKeys.length === 0) {
          setMsg({ type: 'error', text: 'Please select at least one Class Section.' });
          setSubmitting(false);
          return;
        }
        if (selectedSubjectIds.length === 0) {
          setMsg({ type: 'error', text: 'Please select at least one Subject.' });
          setSubmitting(false);
          return;
        }

        const allocations = selectedCohortKeys.map((key) => {
          const [classId, sectionId] = key.split('::');
          return {
            classId,
            sectionId,
            subjectIds: selectedSubjectIds,
          };
        });

        await staffService.assignTeacher({
          teacherId: selectedTeacherId,
          sessionId: selectedSessionId,
          allocations,
        });

        setMsg({
          type: 'success',
          text: `Successfully allocated teacher to ${allocations.length} class cohort(s) across ${selectedSubjectIds.length} subject(s)!`,
        });
      } else {
        // Single mode
        if (!selectedClassId || !selectedSectionId || !selectedSubjectId) {
          setMsg({ type: 'error', text: 'All allocation fields (Class, Section, Subject) are required.' });
          setSubmitting(false);
          return;
        }

        await staffService.assignTeacher({
          teacherId: selectedTeacherId,
          sessionId: selectedSessionId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          subjectIds: [selectedSubjectId],
        });

        setMsg({ type: 'success', text: 'Faculty subject allocation saved successfully!' });
      }

      setShowModal(false);
      const updated = await staffService.getTeacherAssignments();
      setAssignments(updated || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to create teacher assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setEditTeacherId(assignment.teacherId || assignment.teacher?.id || '');
    setEditClassId(assignment.classId || assignment.class?.id || '');
    setEditSectionId(assignment.sectionId || assignment.section?.id || '');
    setEditSubjectId(assignment.subjectId || assignment.subject?.id || '');
  };

  const handleEditClassSelect = (classId: string) => {
    setEditClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls && cls.sections && cls.sections.length > 0) {
      setEditSectionId(cls.sections[0].id);
    } else {
      setEditSectionId('');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    try {
      setSubmitting(true);
      setMsg(null);
      await staffService.updateTeacherAssignment(editingAssignment.id, {
        teacherId: editTeacherId,
        classId: editClassId,
        sectionId: editSectionId,
        subjectId: editSubjectId,
      });

      setMsg({ type: 'success', text: 'Teacher allocation updated successfully!' });
      setEditingAssignment(null);
      const updated = await staffService.getTeacherAssignments();
      setAssignments(updated || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to update teacher assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this teacher assignment?')) return;
    try {
      await staffService.removeTeacherAssignment(id);
      setAssignments(assignments.filter((a) => a.id !== id));
      setMsg({ type: 'success', text: 'Teacher allocation removed successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to remove assignment.' });
    }
  };

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const editClassObj = classes.find((c) => c.id === editClassId);

  const filteredAssignments = assignments.filter((a) => {
    const teacherName = `${a.teacher?.firstName || ''} ${a.teacher?.lastName || ''}`.toLowerCase();
    const empId = (a.teacher?.employeeId || '').toLowerCase();
    const subName = (a.subject?.name || '').toLowerCase();
    const matchSearch = !search || teacherName.includes(search.toLowerCase()) || empId.includes(search.toLowerCase()) || subName.includes(search.toLowerCase());
    const matchClass = !filterClassId || a.classId === filterClassId;
    const matchTeacher = !filterTeacherId || a.teacherId === filterTeacherId;
    return matchSearch && matchClass && matchTeacher;
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-navy/70" />
              Teacher Course & Class Allocations
            </h1>
            <p className="text-sm text-navy/60">
              Allocate faculty members to single or multiple classes, sections, and subjects from database
            </p>
          </div>

          <button
            onClick={() => {
              setMsg(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Allocate Teacher (Single or Multiple)</span>
          </button>
        </div>

        {/* Message Alert */}
        {msg && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-800 border border-rose-500/20'
            }`}
          >
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="p-1 hover:opacity-75 cursor-pointer font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Filter Controls */}
        <GlassCard className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search faculty name, Emp ID, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white/60 border border-white/60 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-navy/40" />
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-white/60 border border-white/60 text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="">All Classes (Database)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-white/60 border border-white/60 text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.employeeId})
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        {/* Allocation Roster Table */}
        <GlassCard className="overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-xs">Loading live faculty allocations from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-navy/10 text-navy/60 uppercase font-bold text-[10px] tracking-wider bg-white/40">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4">Subject Assigned</th>
                    <th className="py-3 px-4">Academic Session</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {filteredAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-white/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {a.teacher?.firstName} {a.teacher?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {a.teacher?.employeeId}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {a.class?.name} — Section {a.section?.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {a.subject?.name} ({a.subject?.code})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{a.session?.name}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(a)}
                            className="p-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition shadow-2xs cursor-pointer font-bold"
                            title="Edit / Update allocation"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition shadow-2xs cursor-pointer font-bold"
                            title="Remove allocation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                        No teacher allocations found. Use &ldquo;Allocate Teacher&rdquo; button above to assign classes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Allocate Teacher Modal (Single or Multiple Classes) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassCard className="max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-navy/10">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-800">
                    Allocate Teacher to Class & Subject
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAllocationMode('single')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    allocationMode === 'single'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Single Class & Section
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationMode('multiple')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    allocationMode === 'multiple'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Multiple Classes / Cohorts (Batch)
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Teacher *</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId}) — {t.department} ({t.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Academic Session *</label>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isCurrent ? '(Active Current Session)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {allocationMode === 'single' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Class *</label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => handleClassSelect(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          required
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Section *</label>
                        <select
                          value={selectedSectionId}
                          onChange={(e) => setSelectedSectionId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          required
                        >
                          {selectedClassObj?.sections && selectedClassObj.sections.length > 0 ? (
                            selectedClassObj.sections.map((sec) => (
                              <option key={sec.id} value={sec.id}>
                                Section {sec.name} (Cap: {sec.capacity})
                              </option>
                            ))
                          ) : (
                            <option value="">No sections in this class</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Subject *</label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                      >
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Multiple Class Cohort Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                          Select Multiple Class Cohorts * ({selectedCohortKeys.length} selected)
                        </label>
                        <button
                          type="button"
                          onClick={selectAllCohorts}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {selectedCohortKeys.length > 0 ? 'Clear / Toggle All' : 'Select All Cohorts'}
                        </button>
                      </div>

                      <div className="max-h-40 overflow-y-auto p-3 rounded-2xl bg-white border border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {classes.flatMap((c) =>
                          (c.sections || []).map((s) => {
                            const key = `${c.id}::${s.id}`;
                            const isSelected = selectedCohortKeys.includes(key);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleCohortSelection(key)}
                                className={`flex items-center gap-1.5 p-2 rounded-xl text-left border transition cursor-pointer text-xs ${
                                  isSelected
                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:bg-slate-100'
                                }`}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span className="truncate">
                                  {c.name}-{s.name}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Multiple Subject Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Select Subjects * ({selectedSubjectIds.length} selected)
                      </label>
                      <div className="max-h-36 overflow-y-auto p-3 rounded-2xl bg-white border border-slate-300 grid grid-cols-2 gap-2">
                        {subjects.map((sub) => {
                          const isSelected = selectedSubjectIds.includes(sub.id);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => toggleSubjectSelection(sub.id)}
                              className={`flex items-center gap-1.5 p-2 rounded-xl text-left border transition cursor-pointer text-xs ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">
                                {sub.name} ({sub.code})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-navy/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-amber-400" />}
                    <span>Confirm & Save Allocation</span>
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Edit Allocation Modal */}
        {editingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassCard className="max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-navy/10">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-800">
                    Update Teacher Allocation
                  </h3>
                </div>
                <button
                  onClick={() => setEditingAssignment(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Faculty Member *</label>
                  <select
                    value={editTeacherId}
                    onChange={(e) => setEditTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Class *</label>
                    <select
                      value={editClassId}
                      onChange={(e) => handleEditClassSelect(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Section *</label>
                    <select
                      value={editSectionId}
                      onChange={(e) => setEditSectionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                    >
                      {editClassObj?.sections?.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          Section {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Subject *</label>
                  <select
                    value={editSubjectId}
                    onChange={(e) => setEditSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-navy/10">
                  <button
                    type="button"
                    onClick={() => setEditingAssignment(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-400" />}
                    <span>Update Allocation</span>
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
