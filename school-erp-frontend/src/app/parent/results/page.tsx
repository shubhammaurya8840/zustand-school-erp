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
import { studentService } from '@/services/student.service';
import { examService } from '@/services/exam.service';
import { masterDataService } from '@/services/master-data.service';

export default function ParentResultsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingCard, setFetchingCard] = useState(false);

  useEffect(() => {
    Promise.all([
      studentService.getMyChildren().catch(() => []),
      masterDataService.getAcademicSessions(),
    ])
      .then(async ([childData, sessions]) => {
        const cList = Array.isArray(childData) ? childData : (childData as any)?.children || [];
        setChildren(cList);
        if (cList.length > 0) setSelectedChildId(cList[0].id);

        const cur = sessions.find((s) => s.isCurrent) || sessions[0];
        if (cur) {
          const exList = await examService.getAll(cur.id);
          setExams(exList || []);
          if (exList && exList.length > 0) setSelectedExamId(exList[0].id);
        }
      })
      .catch((err) => console.error('Failed to load results metadata:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChildId || !selectedExamId) return;
    setFetchingCard(true);
    examService
      .getReportCard(selectedChildId, selectedExamId)
      .then((data) => setReportCard(data))
      .catch((err) => {
        console.error('Failed to load report card:', err);
        setReportCard(null);
      })
      .finally(() => setFetchingCard(false));
  }, [selectedChildId, selectedExamId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-navy/70" />
              Examination Results & Performance Report Cards
            </h1>
            <p className="text-sm text-navy/60">
              Subject evaluations, letter grades, percentile achievements, and printable transcripts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => window.print()}
              className="text-xs px-3.5 py-2 flex items-center gap-1.5 bg-navy text-white shadow-md hover:bg-navy/90"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Transcript</span>
            </GlassButton>
          </div>
        </div>

        {/* Filter Controls */}
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Select Child</label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.class?.name || 'Class'})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Select Examination</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Report Card Viewer */}
        {selectedChild && (
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-white/60 pb-4">
              <div>
                <h2 className="text-xl font-bold text-navy">Zustand Public School</h2>
                <p className="text-xs text-navy/60">Knowledge | Character | Bright Future</p>
                <p className="text-xs font-semibold text-indigo-700 mt-1">Student Performance Transcript</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                  OFFICIAL GRADE CARD
                </span>
              </div>
            </div>

            {/* Ward Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/50 border border-white/80 text-xs">
              <div>
                <span className="text-navy/50 block">Student:</span>
                <span className="font-bold text-navy">
                  {selectedChild.firstName} {selectedChild.lastName}
                </span>
              </div>
              <div>
                <span className="text-navy/50 block">Admission No:</span>
                <span className="font-mono font-medium text-navy">{selectedChild.admissionNo}</span>
              </div>
              <div>
                <span className="text-navy/50 block">Class & Section:</span>
                <span className="font-medium text-navy">
                  {selectedChild.class?.name || 'Class 10'} — {selectedChild.section?.name || 'A'}
                </span>
              </div>
              <div>
                <span className="text-navy/50 block">Roll No:</span>
                <span className="font-medium text-navy">{selectedChild.rollNo || '--'}</span>
              </div>
            </div>

            {fetchingCard ? (
              <div className="py-12 flex flex-col items-center justify-center text-navy/50 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-navy/60" />
                <p className="text-xs">Computing examination report card...</p>
              </div>
            ) : !reportCard || !reportCard.subjectResults || reportCard.subjectResults.length === 0 ? (
              <div className="p-8 text-center text-navy/50 rounded-2xl bg-white/40">
                <p className="font-semibold text-navy">No marks published for this examination yet</p>
                <p className="text-xs text-navy/40 mt-1">Faculty evaluations are in progress.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-navy/5">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-navy/5 text-navy font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3 text-center">Max Marks</th>
                        <th className="py-2.5 px-3 text-center">Pass Marks</th>
                        <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5 bg-white/40">
                      {reportCard.subjectResults.map((sr: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-navy">{sr.subjectName}</td>
                          <td className="py-2.5 px-3 text-center text-navy/60">{sr.maxMarks}</td>
                          <td className="py-2.5 px-3 text-center text-navy/60">{sr.passMarks}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-navy">{sr.marksObtained}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-indigo-700">{sr.grade}</td>
                          <td className="py-2.5 px-3 text-right text-navy/60 italic">{sr.remarks || 'Satisfactory'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Aggregate Summary */}
                <div className="p-4 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-navy/50 block">Aggregate Marks:</span>
                    <span className="font-bold text-base text-navy">
                      {reportCard.totalMarksObtained} / {reportCard.totalMaxMarks}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-navy/50 block">Percentage:</span>
                    <span className="font-bold text-base text-navy">
                      {reportCard.percentage ? `${reportCard.percentage}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-navy/50 block">Term Status:</span>
                    <span
                      className={`font-bold text-base ${
                        reportCard.status === 'PASSED' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {reportCard.status || 'PASSED'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
}

