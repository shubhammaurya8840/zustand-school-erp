'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { examService } from '@/services/exam.service';
import { masterDataService } from '@/services/master-data.service';

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    masterDataService
      .getAcademicSessions()
      .then((sessions) => {
        const cur = sessions.find((s) => s.isCurrent) || sessions[0];
        if (cur) {
          return examService.getAll(cur.id);
        }
        return [];
      })
      .then((data) => setExams(data || []))
      .catch((err) => console.error('Failed to load exams:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-navy/70" />
              Examination Date Sheets & Invigilation
            </h1>
            <p className="text-sm text-navy/60">
              Review institutional examination schedules, paper durations, and enter student marks
            </p>
          </div>
          <Link href="/teacher/results">
            <GlassButton className="text-xs px-3.5 py-2 flex items-center gap-1.5 bg-navy text-white shadow-md">
              <Award className="w-4 h-4" />
              <span>Marks Entry Console</span>
            </GlassButton>
          </Link>
        </div>

        {/* Exams List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading examination schedules...</p>
          </div>
        ) : exams.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <p className="font-semibold text-navy">No examinations scheduled</p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {exams.map((ex) => (
              <GlassCard key={ex.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/60">
                  <div>
                    <h2 className="text-lg font-bold text-navy">{ex.name}</h2>
                    <p className="text-xs text-navy/50 mt-0.5">
                      Type: {ex.type} • Dates: {new Date(ex.startDate).toLocaleDateString()} to{' '}
                      {new Date(ex.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/teacher/results`}>
                    <GlassButton className="text-xs px-3 py-1.5 flex items-center gap-1">
                      <span>Enter Marks</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </GlassButton>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                      <tr>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Timings</th>
                        <th className="py-2.5 px-3 text-right">Max Marks</th>
                        <th className="py-2.5 px-3 text-right">Pass Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {ex.schedules?.map((sc: any) => (
                        <tr key={sc.id} className="hover:bg-white/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-navy">{sc.class?.name || 'Class'}</td>
                          <td className="py-2.5 px-3 font-medium text-navy/80">{sc.subject?.name || 'Subject'}</td>
                          <td className="py-2.5 px-3 text-navy/60">{new Date(sc.examDate).toLocaleDateString()}</td>
                          <td className="py-2.5 px-3 text-navy/60 font-mono">
                            {sc.startTime} - {sc.endTime}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-navy">{sc.maxMarks}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{sc.passMarks}</td>
                        </tr>
                      ))}
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

