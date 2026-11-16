'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { attendanceService } from '@/services/attendance.service';

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService
      .getMyAttendance()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load student attendance:', err))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    percentage: 0,
  };

  const records = data?.records || [];
  const percent = Number(summary.percentage) || 0;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-navy/70" />
              My Attendance & Academic Presence
            </h1>
            <p className="text-sm text-navy/60">
              {data?.student
                ? `${data.student.name} (${data.student.admissionNo}) • ${data.student.class} - ${data.student.section}`
                : 'Daily presence tracking and term compliance percentage'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Retrieving your attendance ledger...</p>
          </div>
        ) : (
          <>
            {/* Circular Gauge & Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <GlassCard className="p-5 flex flex-col items-center justify-center text-center col-span-1 md:col-span-1">
                <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-navy/10"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={percent >= 75 ? 'text-emerald-500' : 'text-amber-500'}
                      strokeDasharray={`${percent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold text-navy">{percent}%</span>
                    <span className="text-[10px] text-navy/50 block">Term Presence</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    percent >= 75
                      ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                  }`}
                >
                  {percent >= 75 ? 'Exam Eligible' : 'Attention Needed'}
                </span>
              </GlassCard>

              <GlassCard className="p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-navy/50 block">Instructional Days</span>
                  <span className="text-2xl font-bold text-navy mt-1">{summary.totalDays} Days</span>
                </div>
                <p className="text-[11px] text-navy/50">Recorded sessions in database</p>
              </GlassCard>

              <GlassCard className="p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-navy/50 block">Days Present</span>
                  <span className="text-2xl font-bold text-emerald-700 mt-1">{summary.present} Days</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">Regular classroom attendance</p>
              </GlassCard>

              <GlassCard className="p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-navy/50 block">Absences & Leaves</span>
                  <span className="text-2xl font-bold text-rose-700 mt-1">
                    {summary.absent + summary.leave} Days
                  </span>
                </div>
                <p className="text-[11px] text-navy/50">
                  Late: {summary.late} • Unexcused: {summary.absent}
                </p>
              </GlassCard>
            </div>

            {/* Attendance Ledger Table */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-navy">Daily Attendance Records</h3>
                  <p className="text-xs text-navy/60">Individual day-by-day verified roll call logs</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px]">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Remarks / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-white/40">
                        <td className="py-3 px-3 font-semibold text-navy">
                          {new Date(r.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30'
                                : r.status === 'ABSENT'
                                ? 'bg-rose-500/15 text-rose-900 border border-rose-500/30'
                                : r.status === 'LATE'
                                ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-900 border border-blue-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-navy/70">{r.remarks || 'Standard session verified'}</td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-navy/50">
                          No attendance records found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
