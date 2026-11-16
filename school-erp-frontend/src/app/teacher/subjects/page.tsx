'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Layers,
  GraduationCap,
  Clock,
  CheckCircle2,
  Loader2,
  Users,
  School,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { staffService } from '@/services/staff.service';

interface AssignedSubjectItem {
  id: string;
  name: string;
  code: string;
  type: string;
  isOptional: boolean;
  assignedClasses: Array<{
    classId: string;
    className: string;
    sectionId?: string;
    sectionName?: string;
  }>;
  totalSections: number;
  studentCount: number;
}

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<AssignedSubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getMySubjects()
      .then((data) => setSubjects(data || []))
      .catch((err) => console.error('Failed to load assigned subjects:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-navy/70" />
              Assigned Subjects & Teaching Allocations
            </h1>
            <p className="text-sm text-navy/60">
              Your active teaching subjects, assigned classes, and cohort enrollments configured by administration
            </p>
          </div>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading teaching curriculum allocations...</p>
          </div>
        ) : subjects.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <BookOpen className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-bold text-navy">No Teaching Subjects Allocated Yet</p>
            <p className="text-xs text-navy/50 mt-1 max-w-md mx-auto">
              You have not been assigned to any subjects or classes for the active academic term. Please contact the School Administrator to allocate subjects to your faculty profile.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub) => (
              <GlassCard
                key={sub.id}
                className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-white/60 bg-gradient-to-br from-white/70 to-white/40"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 flex items-center justify-center font-bold text-navy text-sm border border-white/60">
                        {sub.code ? sub.code.substring(0, 3) : 'SUB'}
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

                  <div className="mt-3 pt-3 border-t border-white/50 space-y-2.5 text-xs text-navy/70">
                    <div className="flex items-center justify-between">
                      <span className="text-navy/50 font-medium">Curriculum Nature:</span>
                      <span className="font-semibold text-slate-800">
                        {sub.isOptional ? 'Elective Course' : 'Core Compulsory'}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-navy/60 block font-semibold mb-1.5">
                        Assigned Classes & Sections:
                      </span>
                      {sub.assignedClasses && sub.assignedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {sub.assignedClasses.map((ac, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2.5 py-1 rounded-xl bg-indigo-50/80 border border-indigo-200/60 font-semibold text-indigo-900 shadow-2xs"
                            >
                              {ac.className} {ac.sectionName ? `— Section ${ac.sectionName}` : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-navy/40 italic">No specific sections assigned</span>
                      )}
                    </div>

                    <div className="mt-2 pt-2.5 border-t border-white/40 flex items-center justify-between text-xs text-navy/60">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-navy/40" />
                        <span>{sub.totalSections} Section{sub.totalSections !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-navy/40" />
                        <span>{sub.studentCount} Active Student{sub.studentCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-white/50 flex items-center justify-between text-xs">
                  <span className="text-navy/50 font-medium">Status</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Allocated by Admin
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
