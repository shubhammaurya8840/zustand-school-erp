'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  School,
  Loader2,
  CheckCircle2,
  User,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { timetableService, TimetablePeriodItem } from '@/services/timetable.service';
import { masterDataService, ClassModel } from '@/services/master-data.service';

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

export default function TeacherTimetablePage() {
  const [viewMode, setViewMode] = useState<'my-schedule' | 'class-schedule'>('my-schedule');
  const [allClasses, setAllClasses] = useState<ClassModel[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [periods, setPeriods] = useState<TimetablePeriodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    masterDataService
      .getClasses()
      .then((data) => {
        setAllClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClassId(data[0].id);
          if (data[0].sections && data[0].sections.length > 0) {
            setSelectedSectionId(data[0].sections[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load school classes:', err));
  }, []);

  const currentClass = allClasses.find((c) => c.id === selectedClassId);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = allClasses.find((c) => c.id === classId);
    if (cls && cls.sections && cls.sections.length > 0) {
      setSelectedSectionId(cls.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const loadTimetable = async () => {
    try {
      setLoading(true);
      if (viewMode === 'my-schedule') {
        const data = await timetableService.getMyTeacherSchedule();
        setPeriods(data || []);
      } else {
        if (!selectedClassId || !selectedSectionId) {
          setPeriods([]);
          return;
        }
        const data = await timetableService.getClassTimetable({
          classId: selectedClassId,
          sectionId: selectedSectionId,
        });
        setPeriods(data || []);
      }
    } catch (err: any) {
      console.error('Failed to load timetable:', err);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [viewMode, selectedClassId, selectedSectionId]);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-navy/70" />
              Teacher&apos;s Academic Timetable
            </h1>
            <p className="text-sm text-navy/60">
              Weekly class timetable, assigned lectures, laboratory slots, and periods
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('my-schedule')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'my-schedule'
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-white/60 text-navy/70 border border-white/70 hover:bg-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Teaching Schedule</span>
            </button>
            <button
              onClick={() => setViewMode('class-schedule')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'class-schedule'
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-white/60 text-navy/70 border border-white/70 hover:bg-white'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Assigned Class Timetable</span>
            </button>
          </div>
        </div>

        {/* Filters if in class-schedule mode */}
        {viewMode === 'class-schedule' && (
          <GlassCard className="p-4 flex flex-wrap items-center gap-4">
            <div className="w-full sm:w-64">
              <label className="block text-[11px] font-bold text-navy/60 uppercase mb-1">Academic Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 shadow-2xs"
              >
                {allClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-bold text-navy/60 uppercase mb-1">Section</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!currentClass || !currentClass.sections || currentClass.sections.length === 0}
                className="w-full px-3 py-2 rounded-xl border border-white/60 bg-white/70 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 shadow-2xs"
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
          </GlassCard>
        )}

        {/* Timetable Grid */}
        <GlassCard className="p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading timetable records...</p>
            </div>
          ) : viewMode === 'class-schedule' && (!currentClass?.sections || currentClass.sections.length === 0) ? (
            <div className="py-16 text-center text-navy/50 space-y-2">
              <School className="w-10 h-10 mx-auto text-navy/20" />
              <p className="text-sm font-semibold text-navy">No sections registered for {currentClass?.name || 'this class'}</p>
              <p className="text-xs text-navy/40">Sections are optional. Add a section under Classes when you are ready to schedule periods.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px]">
                    <th className="py-3 px-3 text-left w-24">Day</th>
                    {PERIOD_NUMBERS.map((p) => (
                      <th key={p} className="py-3 px-2 text-center">
                        <div>Period {p}</div>
                        <div className="text-[9px] font-normal text-navy/40">
                          {DEFAULT_SLOTS[p]?.start}-{DEFAULT_SLOTS[p]?.end}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {DAYS.map((day) => (
                    <tr key={day} className="hover:bg-white/40">
                      <td className="py-3 px-3 font-bold text-navy capitalize">{day.toLowerCase()}</td>
                      {PERIOD_NUMBERS.map((p) => {
                        const slot = periods.find((item) => item.dayOfWeek === day && item.periodNo === p);
                        return (
                          <td key={p} className="p-1.5 text-center align-top">
                            {slot ? (
                              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-500/20 text-navy shadow-xs flex flex-col justify-between h-20">
                                <div>
                                  <div className="font-bold text-[11px] truncate">{slot.subject?.name}</div>
                                  <div className="text-[10px] text-navy/60 font-mono">
                                    {slot.class ? `${slot.class.name} (${slot.section?.name})` : slot.subject?.code}
                                  </div>
                                </div>
                                <div className="text-[9px] font-medium text-navy/50">
                                  Room: {slot.roomNo || 'N/A'}
                                </div>
                              </div>
                            ) : (
                              <div className="h-20 rounded-xl border border-dashed border-navy/10 flex items-center justify-center text-navy/20 text-[10px]">
                                —
                              </div>
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
      </div>
    </DashboardLayout>
  );
}
