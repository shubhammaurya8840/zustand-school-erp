'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  School,
  Users,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { staffService } from '@/services/staff.service';

export default function TeacherClassesPage() {
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getMyClasses()
      .then((data) => setAssignedClasses(data || []))
      .catch((err) => console.error('Failed to load teacher assigned classes:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <School className="w-7 h-7 text-navy/70" />
              My Assigned Classes & Sections
            </h1>
            <p className="text-sm text-navy/60">
              Direct access to your assigned teaching cohorts, class workspaces, and student records
            </p>
          </div>
          <Link href="/teacher/attendance">
            <GlassButton className="text-xs px-3.5 py-2 flex items-center gap-1.5 bg-navy text-white shadow-md">
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Today&apos;s Attendance</span>
            </GlassButton>
          </Link>
        </div>

        {/* Classes List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading assigned cohorts...</p>
          </div>
        ) : assignedClasses.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <School className="w-12 h-12 text-navy/30 mx-auto mb-3" />
            <p className="font-semibold text-navy text-base">No Assigned Classes Found</p>
            <p className="text-xs text-navy/60 mt-1 max-w-md mx-auto">
              You are currently not assigned to any class or section for this academic term. Please contact the School
              Administration.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignedClasses.map((item) => (
              <GlassCard
                key={`${item.classId}-${item.sectionId}`}
                className="p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-white/60 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center font-bold text-navy text-base border border-white/60 shadow-inner">
                        {item.className.replace('Class ', '')}
                      </div>
                      <div>
                        <h3 className="font-black text-navy text-base">
                          {item.className} - {item.sectionName}
                        </h3>
                        <p className="text-xs text-navy/60 font-medium">
                          {item.studentCount} Active Students
                        </p>
                      </div>
                    </div>
                    {item.isClassTeacher && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Class Teacher
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-navy/10 space-y-2">
                    <span className="text-[11px] font-semibold text-navy/50 block">Your Assigned Subjects:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.subjects?.map((sub: any) => (
                        <span
                          key={sub.id}
                          className="px-2.5 py-1 rounded-xl bg-white/70 border border-white/80 text-[11px] font-semibold text-navy shadow-xs"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-navy/10 flex items-center justify-between">
                  <span className="text-xs text-navy/60 font-mono">
                    Session 2026-27
                  </span>
                  <Link href={`/teacher/classes/${item.classId}/${item.sectionId}`}>
                    <GlassButton className="px-3.5 py-1.5 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1 hover:gap-2 transition-all">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </GlassButton>
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
