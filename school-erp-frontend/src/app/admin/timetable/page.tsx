'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  Loader2,
  School,
  BookOpen,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { timetableService, TimetablePeriodItem } from '@/services/timetable.service';
import { masterDataService, ClassModel, SubjectModel, AcademicSessionModel } from '@/services/master-data.service';
import { staffService, StaffListItem } from '@/services/staff.service';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_SLOTS: Record<number, { start: string; end: string }> = {
  1: { start: '08:30', end: '09:15' },
  2: { start: '09:15', end: '10:00' },
  3: { start: '10:00', end: '10:45' },
  4: { start: '11:00', end: '11:45' },
  5: { start: '11:45', end: '12:30' },
  6: { start: '12:30', end: '01:15' },
  7: { start: '01:45', end: '02:30' },
  8: { start: '02:30', end: '03:15' },
};

export default function AdminTimetablePage() {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionModel[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [teachers, setTeachers] = useState<StaffListItem[]>([]);
  const [periods, setPeriods] = useState<TimetablePeriodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  // Add Period Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{ day: string; periodNo: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [periodForm, setPeriodForm] = useState({
    subjectId: '',
    teacherId: '',
    startTime: '08:30',
    endTime: '09:15',
    roomNo: 'Room 201',
  });

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [classData, sessData, subjData, staffData] = await Promise.all([
        masterDataService.getClasses(),
        masterDataService.getAcademicSessions(),
        masterDataService.getSubjects(),
        staffService.getAll({ role: 'TEACHER', limit: 100 }),
      ]);
      setClasses(classData);
      setSessions(sessData);
      setSubjects(subjData);
      setTeachers(staffData.staff || []);

      const curSess = sessData.find((s) => s.isCurrent) || sessData[0];
      if (curSess) setSelectedSessionId(curSess.id);

      if (classData && classData.length > 0) {
        setSelectedClassId(classData[0].id);
        if (classData[0].sections && classData[0].sections.length > 0) {
          setSelectedSectionId(classData[0].sections[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load timetable metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadTimetable = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    try {
      setLoading(true);
      const data = await timetableService.getClassTimetable({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        sessionId: selectedSessionId || undefined,
      });
      setPeriods(data || []);
    } catch (err: any) {
      console.error('Failed to load class timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [selectedClassId, selectedSectionId, selectedSessionId]);

  // Handle Class change
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const cls = classes.find((c) => c.id === newClassId);
    if (cls && cls.sections && cls.sections.length > 0) {
      setSelectedSectionId(cls.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const handleOpenAdd = (day: string, periodNo: number) => {
    const slot = DEFAULT_SLOTS[periodNo] || { start: '08:30', end: '09:15' };
    setTargetSlot({ day, periodNo });
    setPeriodForm({
      subjectId: subjects.length > 0 ? subjects[0].id : '',
      teacherId: teachers.length > 0 ? teachers[0].id : '',
      startTime: slot.start,
      endTime: slot.end,
      roomNo: 'Room 201',
    });
    setIsAddOpen(true);
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlot || !selectedClassId || !selectedSectionId || !selectedSessionId) return;
    try {
      setSubmitting(true);
      setMessage(null);
      await timetableService.createPeriod({
        sessionId: selectedSessionId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        subjectId: periodForm.subjectId,
        teacherId: periodForm.teacherId,
        dayOfWeek: targetSlot.day,
        periodNo: targetSlot.periodNo,
        startTime: periodForm.startTime,
        endTime: periodForm.endTime,
        roomNo: periodForm.roomNo,
      });
      setMessage({ type: 'success', text: `Period ${targetSlot.periodNo} scheduled successfully!` });
      setIsAddOpen(false);
      loadTimetable();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save timetable period' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    try {
      await timetableService.deletePeriod(id);
      setMessage({ type: 'success', text: 'Period removed from schedule' });
      loadTimetable();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove period' });
    }
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-navy/70" />
              Class & Section Timetable Grid
            </h1>
            <p className="text-sm text-navy/60">
              Manage weekly teaching periods, classroom allocations, and faculty timetables
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAdd('MONDAY', 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Period Slot</span>
          </button>
        </div>

        {/* Alerts */}
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

        {/* Selector Toolbar */}
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Academic Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Section</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {currentClass?.sections && currentClass.sections.length > 0 ? (
                  currentClass.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name}
                    </option>
                  ))
                ) : (
                  <option value="">No sections available</option>
                )}
              </select>
            </div>

            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Academic Session</label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Timetable Grid */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy/60" />
              Weekly Schedule: {currentClass?.name || 'Class'}
            </h3>
            <span className="text-xs text-navy/50">Click "+" in any slot to assign period</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading weekly timetable grid...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-navy/5 text-navy font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-28 border-r border-navy/5">Day / Time</th>
                    {PERIOD_NUMBERS.map((p) => (
                      <th key={p} className="py-3 px-2 text-center border-r border-navy/5 min-w-[130px]">
                        Period {p}
                        <span className="block text-[10px] text-navy/40 font-normal">
                          {DEFAULT_SLOTS[p]?.start} - {DEFAULT_SLOTS[p]?.end}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {DAYS.map((day) => (
                    <tr key={day} className="hover:bg-white/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-navy border-r border-navy/5 uppercase text-[11px] tracking-wider">
                        {day.substring(0, 3)}
                      </td>
                      {PERIOD_NUMBERS.map((pNum) => {
                        const matching = periods.find(
                          (item) => item.dayOfWeek === day && item.periodNo === pNum
                        );

                        return (
                          <td
                            key={pNum}
                            className="p-1.5 border-r border-navy/5 align-top min-w-[130px] h-20"
                          >
                            {matching ? (
                              <div className="p-2 rounded-xl bg-white/70 border border-white/90 shadow-sm relative group flex flex-col justify-between h-full">
                                <div>
                                  <span className="font-bold text-navy block text-[11px] truncate">
                                    {matching.subject?.name || 'Subject'}
                                  </span>
                                  <span className="text-[10px] text-navy/60 block truncate">
                                    {matching.teacher ? `${matching.teacher.firstName} ${matching.teacher.lastName}` : 'TBD'}
                                  </span>
                                  <span className="text-[9px] text-navy/40 block mt-0.5">
                                    {matching.roomNo}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeletePeriod(matching.id)}
                                  className="absolute top-1 right-1 p-1 rounded-md text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all"
                                  title="Delete Period"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenAdd(day, pNum)}
                                className="w-full h-full rounded-xl border border-dashed border-navy/15 hover:border-navy/40 hover:bg-white/40 flex items-center justify-center text-navy/30 hover:text-navy transition-all"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Add Period Modal */}
        <AnimatePresence>
          {isAddOpen && targetSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">
                      Assign Period {targetSlot.periodNo} ({targetSlot.day})
                    </h2>
                  </div>
                  <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePeriod} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Curriculum Subject *</label>
                    <select
                      required
                      value={periodForm.subjectId}
                      onChange={(e) => setPeriodForm({ ...periodForm, subjectId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Faculty Teacher *</label>
                    <select
                      required
                      value={periodForm.teacherId}
                      onChange={(e) => setPeriodForm({ ...periodForm, teacherId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
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
                      <label className="block text-navy/70 font-medium mb-1">Start Time *</label>
                      <input
                        type="time"
                        required
                        value={periodForm.startTime}
                        onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">End Time *</label>
                      <input
                        type="time"
                        required
                        value={periodForm.endTime}
                        onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Room / Lab Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Lab 1 or Room 204"
                      value={periodForm.roomNo}
                      onChange={(e) => setPeriodForm({ ...periodForm, roomNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAddOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Saving...' : 'Save Period'}
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

