'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  Printer,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { examService } from '@/services/exam.service';
import { studentService } from '@/services/student.service';

export default function StudentResultsPage() {
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [selectedExamIndex, setSelectedExamIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentService.getMe(), examService.getMyResults()])
      .then(([me, results]) => {
        setStudentInfo(me);
        setReportCards(results || []);
      })
      .catch((err) => console.error('Failed to load student results:', err))
      .finally(() => setLoading(false));
  }, []);

  const activeCard = reportCards[selectedExamIndex];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-navy/70" />
              Examination Results & Official Transcripts
            </h1>
            <p className="text-sm text-navy/60">
              {studentInfo
                ? `${studentInfo.firstName} ${studentInfo.lastName} (${studentInfo.admissionNo}) • ${studentInfo.class?.name} - ${studentInfo.section?.name}`
                : 'Subject evaluations, letter grades, and academic achievements'}
            </p>
          </div>
          <GlassButton
            onClick={() => window.print()}
            className="text-xs px-3.5 py-2 flex items-center gap-1.5 bg-navy text-white shadow-md hover:bg-navy/90"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Transcript</span>
          </GlassButton>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Fetching verified transcripts...</p>
          </div>
        ) : reportCards.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Award className="w-12 h-12 text-navy/30 mx-auto mb-3" />
            <p className="font-semibold text-navy text-base">No Published Results Found</p>
            <p className="text-xs text-navy/60 mt-1 max-w-sm mx-auto">
              Exam marks have not yet been published for your class, or examinations are currently underway.
            </p>
          </GlassCard>
        ) : (
          <>
            {/* Exam Selector */}
            <GlassCard className="p-4">
              <div>
                <label className="block text-xs font-semibold text-navy/70 mb-1">Select Examination</label>
                <select
                  value={selectedExamIndex}
                  onChange={(e) => setSelectedExamIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  {reportCards.map((rc, idx) => (
                    <option key={rc.exam?.id || idx} value={idx}>
                      {rc.exam?.name} ({rc.exam?.session})
                    </option>
                  ))}
                </select>
              </div>
            </GlassCard>

            {activeCard && (
              <div className="space-y-6">
                {/* Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <GlassCard className="p-4 text-center">
                    <span className="text-[11px] text-navy/50 block">Aggregate Percentage</span>
                    <span className="text-2xl font-black text-navy mt-1">{activeCard.percentage}%</span>
                  </GlassCard>

                  <GlassCard className="p-4 text-center">
                    <span className="text-[11px] text-navy/50 block">Overall Letter Grade</span>
                    <span className="text-2xl font-black text-indigo-700 mt-1">{activeCard.grade}</span>
                  </GlassCard>

                  <GlassCard className="p-4 text-center">
                    <span className="text-[11px] text-navy/50 block">Total Marks Obtained</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1">
                      {activeCard.totalMarksObtained} / {activeCard.totalMaxMarks}
                    </span>
                  </GlassCard>

                  <GlassCard className="p-4 text-center">
                    <span className="text-[11px] text-navy/50 block">Result Status</span>
                    <span
                      className={`text-sm font-bold inline-block mt-2 px-3 py-0.5 rounded-full ${
                        activeCard.resultStatus === 'PASSED'
                          ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-900 border border-rose-500/30'
                      }`}
                    >
                      {activeCard.resultStatus}
                    </span>
                  </GlassCard>
                </div>

                {/* Subject-Wise Report Card */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-navy/10 mb-4">
                    <div>
                      <h3 className="font-bold text-navy text-base">{activeCard.exam?.name} - Statement of Marks</h3>
                      <p className="text-xs text-navy/60">Zustand Public School • Continuous Comprehensive Evaluation</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-navy/10 text-navy/60 uppercase font-semibold text-[10px]">
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3 text-center">Max Marks</th>
                          <th className="py-2.5 px-3 text-center">Pass Marks</th>
                          <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                          <th className="py-2.5 px-3 text-center">Grade</th>
                          <th className="py-2.5 px-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5">
                        {activeCard.subjects?.map((sub: any, i: number) => (
                          <tr key={i} className="hover:bg-white/40">
                            <td className="py-2.5 px-3 font-semibold text-navy">{sub.subject}</td>
                            <td className="py-2.5 px-3 font-mono text-navy/70">{sub.code}</td>
                            <td className="py-2.5 px-3 text-center text-navy/60">{sub.maxMarks}</td>
                            <td className="py-2.5 px-3 text-center text-navy/60">{sub.passMarks}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-navy">{sub.marksObtained}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-900 font-bold text-[11px]">
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-navy/70">{sub.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
