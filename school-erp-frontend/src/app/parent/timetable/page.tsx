'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  School,
  Loader2,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { timetableService, TimetablePeriodItem } from '@/services/timetable.service';
import { studentService } from '@/services/student.service';

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

export default function ParentTimetablePage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [periods, setPeriods] = useState<TimetablePeriodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService
      .getMyChildren()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.children || [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedChildId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load children:', err))
      .finally(() => setLoading(false));
  }, []);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  useEffect(() => {
    if (!selectedChild?.classId && !selectedChild?.class?.id) return;
    const cid = selectedChild.classId || selectedChild.class?.id;
    const sid = selectedChild.sectionId || selectedChild.section?.id;

    if (!cid || !sid) return;

    setLoading(true);
    timetableService
      .getClassTimetable({ classId: cid, sectionId: sid })
      .then((data) => setPeriods(data || []))
      .catch((err) => console.error('Failed to load timetable:', err))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-navy/70" />
              Ward Class Timetable & Schedule
            </h1>
            <p className="text-sm text-navy/60">
              Weekly class timetable, subject periods, teacher allocations, and lab hours
            </p>
          </div>

          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.class?.name || 'Class'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Child Info */}
        {selectedChild && (
          <GlassCard className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold text-sm border border-white/60">
                {selectedChild.firstName[0]}
                {selectedChild.lastName[0]}
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">
                  {selectedChild.firstName} {selectedChild.lastName}
                </h2>
                <p className="text-xs text-navy/50">
                  {selectedChild.class?.name || 'Class 10'} — Section {selectedChild.section?.name || 'A'}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy/5 text-navy/70">
              Weekly Mon - Sat Schedule
            </span>
          </GlassCard>
        )}

        {/* Timetable Grid */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy/60" />
              Weekly Teaching Periods
            </h3>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading timetable schedule...</p>
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
                              <div className="p-2 rounded-xl bg-white/70 border border-white/90 shadow-sm flex flex-col justify-between h-full">
                                <div>
                                  <span className="font-bold text-navy block text-[11px] truncate">
                                    {matching.subject?.name || 'Subject'}
                                  </span>
                                  <span className="text-[10px] text-navy/60 block truncate">
                                    {matching.teacher ? `${matching.teacher.firstName} ${matching.teacher.lastName}` : 'Teacher'}
                                  </span>
                                  <span className="text-[9px] text-navy/40 block mt-0.5">
                                    {matching.roomNo}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full rounded-xl border border-dashed border-navy/10 flex items-center justify-center text-[10px] text-navy/20">
                                Recess / Free
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

