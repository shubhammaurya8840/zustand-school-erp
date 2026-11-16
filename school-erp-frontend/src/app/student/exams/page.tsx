'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  Clock,
  BookOpen,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { examService } from '@/services/exam.service';
import { masterDataService } from '@/services/master-data.service';

export default function StudentExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    masterDataService
      .getAcademicSessions()
      .then((sessions) => {
        const cur = sessions.find((s) => s.isCurrent) || sessions[0];
        if (cur) return examService.getAll(cur.id);
        return [];
      })
      .then((data) => setExams(data || []))
      .catch((err) => console.error('Failed to load student exams:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-navy/70" />
              Examination Date Sheets & Schedules
            </h1>
            <p className="text-sm text-navy/60">
              Exam dates, subject papers, paper timings, and maximum mark allocations
            </p>
          </div>
        </div>

        {/* Exams List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading examination date sheet...</p>
          </div>
        ) : exams.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <p className="font-semibold text-navy">No examinations currently scheduled</p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {exams.map((ex) => (
              <GlassCard key={ex.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/60">
                  <div>
                    <h2 className="text-lg font-bold text-navy">{ex.name}</h2>
                    <p className="text-xs text-navy/50 mt-0.5">
                      Type: {ex.type} • Duration: {new Date(ex.startDate).toLocaleDateString()} to{' '}
                      {new Date(ex.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-800 border border-blue-500/20">
                    {ex.isPublished ? 'Published Schedule' : 'Upcoming Examination'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                      <tr>
                        <th className="py-2.5 px-3">Subject Paper</th>
                        <th className="py-2.5 px-3">Exam Date</th>
                        <th className="py-2.5 px-3">Paper Timings</th>
                        <th className="py-2.5 px-3 text-right">Max Marks</th>
                        <th className="py-2.5 px-3 text-right">Passing Threshold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {ex.schedules && ex.schedules.length > 0 ? (
                        ex.schedules.map((sc: any) => (
                          <tr key={sc.id} className="hover:bg-white/30 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-navy">
                              {sc.subject?.name || 'Subject Paper'}
                            </td>
                            <td className="py-2.5 px-3 text-navy/70">
                              {new Date(sc.examDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-navy/70">
                              {sc.startTime} - {sc.endTime}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-navy">{sc.maxMarks}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                              {sc.passMarks}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-navy/40 italic">
                            Paper timetable for your class is being finalized.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

