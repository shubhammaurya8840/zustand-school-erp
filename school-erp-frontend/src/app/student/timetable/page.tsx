'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  School,
  Loader2,
  CheckCircle2,
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

export default function StudentTimetablePage() {
  const [periods, setPeriods] = useState<TimetablePeriodItem[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentService.getMe(), timetableService.getMyClassTimetable()])
      .then(([me, tt]) => {
        setStudentInfo(me);
        setPeriods(tt || []);
      })
      .catch((err) => console.error('Failed to load student timetable:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-navy/70" />
              Class Timetable & Daily Schedule
            </h1>
            <p className="text-sm text-navy/60">
              {studentInfo
                ? `${studentInfo.class?.name} - Section ${studentInfo.section?.name} • Session 2026-27`
                : 'Weekly lecture schedule and subject periods'}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/70 border border-white/80 text-navy">
            Academic Session 2026-27
          </span>
        </div>

        {/* Timetable Grid */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy/60" />
              Weekly Lecture Schedule (Monday to Saturday)
            </h3>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading your class schedule...</p>
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
                    <tr key={day} className="hover:bg-white/40">
                      <td className="py-3 px-3 font-bold text-navy border-r border-navy/5 capitalize">
                        {day.toLowerCase()}
                      </td>
                      {PERIOD_NUMBERS.map((p) => {
                        const slot = periods.find((item) => item.dayOfWeek === day && item.periodNo === p);
                        return (
                          <td key={p} className="p-2 border-r border-navy/5 align-top">
                            {slot ? (
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-navy shadow-xs flex flex-col justify-between h-20">
                                <div>
                                  <div className="font-bold text-[11px] truncate">{slot.subject?.name}</div>
                                  <div className="text-[10px] text-navy/60 font-mono">
                                    {slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName}` : ''}
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
