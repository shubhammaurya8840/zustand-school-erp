'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { studentService } from '@/services/student.service';
import { attendanceService } from '@/services/attendance.service';

export default function ParentAttendancePage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingAtt, setFetchingAtt] = useState(false);

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

  useEffect(() => {
    if (!selectedChildId) return;
    setFetchingAtt(true);
    attendanceService
      .getStudentAttendance(selectedChildId)
      .then((res) => setAttendanceData(res))
      .catch((err) => {
        console.error('Failed to load child attendance:', err);
        setAttendanceData(null);
      })
      .finally(() => setFetchingAtt(false));
  }, [selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const summary = attendanceData?.stats || attendanceData?.summary || {
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    percentage: 0,
  };
  const totalDays = summary.totalMarked !== undefined ? summary.totalMarked : (summary.totalDays || 0);
  const records = attendanceData?.records || [];
  const percent = Number(summary.percentage) || 0;

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-navy/70" />
              Ward Attendance & Punctuality
            </h1>
            <p className="text-sm text-navy/60">
              Verified daily attendance records and term compliance for your linked children
            </p>
          </div>

          {/* Ward Switcher */}
          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-navy/70">Select Ward:</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 font-semibold"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.class?.name || 'Class'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Retrieving linked wards...</p>
          </div>
        ) : children.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Users className="w-12 h-12 text-navy/30 mx-auto mb-3" />
            <p className="font-semibold text-navy text-base">No Linked Children Found</p>
            <p className="text-xs text-navy/60 mt-1 max-w-sm mx-auto">
              No students are currently linked to your parent account. Please contact the School Administration.
            </p>
          </GlassCard>
        ) : (
          <>
            {/* Selected Child Overview Card */}
            {selectedChild && (
              <GlassCard className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold text-base border border-white/60">
                    {selectedChild.firstName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-base">
                      {selectedChild.firstName} {selectedChild.lastName}
                    </h3>
                    <p className="text-xs text-navy/60">
                      Admission No: {selectedChild.admissionNo} • Roll No: {selectedChild.rollNo} •{' '}
                      {selectedChild.class?.name} - {selectedChild.section?.name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-navy">{percent}%</span>
                  <span className="text-[10px] text-navy/50 block">Attendance Rate</span>
                </div>
              </GlassCard>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4 text-center">
                <span className="text-[11px] text-navy/50 block">Instructional Days</span>
                <span className="text-2xl font-bold text-navy mt-1">{totalDays}</span>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <span className="text-[11px] text-navy/50 block">Present</span>
                <span className="text-2xl font-bold text-emerald-700 mt-1">{summary.present}</span>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <span className="text-[11px] text-navy/50 block">Absences</span>
                <span className="text-2xl font-bold text-rose-700 mt-1">{summary.absent}</span>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <span className="text-[11px] text-navy/50 block">Late / Leave</span>
                <span className="text-2xl font-bold text-amber-700 mt-1">{summary.late + summary.leave}</span>
              </GlassCard>
            </div>

            {/* Daily Records */}
            <GlassCard className="p-6">
              <h3 className="font-bold text-navy text-base mb-4">Official Attendance Roster Logs</h3>
              {fetchingAtt ? (
                <div className="py-12 flex justify-center text-navy/50">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Session Details / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {records.map((r: any) => (
                        <tr key={r.id} className="hover:bg-white/40">
                          <td className="py-2.5 px-3 font-semibold text-navy">
                            {new Date(r.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                          <td className="py-2.5 px-3 text-navy/70">{r.remarks || 'Standard verified presence'}</td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-navy/50">
                            No attendance records on file for this student yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
