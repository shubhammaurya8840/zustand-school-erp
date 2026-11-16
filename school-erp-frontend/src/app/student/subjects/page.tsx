'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { masterDataService, SubjectModel } from '@/services/master-data.service';

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    masterDataService
      .getSubjects()
      .then((data) => setSubjects(data || []))
      .catch((err) => console.error('Failed to load curriculum:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-navy/70" />
              My Enrolled Subjects & Courses
            </h1>
            <p className="text-sm text-navy/60">
              Curriculum syllabus, course codes, lecture credits, and laboratory components
            </p>
          </div>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading course curricula...</p>
          </div>
        ) : subjects.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <p className="font-semibold text-navy">No subjects enrolled</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub: any) => (
              <GlassCard key={sub.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 flex items-center justify-center font-bold text-navy text-sm border border-white/60">
                        {sub.code.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-bold text-navy text-base">{sub.name}</h3>
                        <p className="text-xs font-mono text-navy/50">Code: {sub.code}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        sub.type === 'THEORY'
                          ? 'bg-blue-500/10 text-blue-800 border-blue-500/20'
                          : sub.type === 'PRACTICAL'
                          ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-800 border-purple-500/20'
                      }`}
                    >
                      {sub.type}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/50 space-y-2 text-xs text-navy/70">
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Nature:</span>
                      <span className="font-medium">{sub.isOptional ? 'Elective Course' : 'Compulsory Core'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Faculty In-Charge:</span>
                      <span className="font-semibold text-navy">Senior Department Faculty</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/50 flex items-center justify-between text-xs text-navy/60">
                  <span>Term Coverage</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Completed
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

