'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  Award,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Phone,
  School,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { studentService } from '@/services/student.service';

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService
      .getMyChildren()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any)?.children || [];
        setChildren(list);
      })
      .catch((err) => {
        console.error('Failed to load linked children:', err);
        setChildren([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-navy/70" />
              My Wards & Enrolled Children
            </h1>
            <p className="text-sm text-navy/60">
              Academic progress, attendance records, and institutional ledger for your children
            </p>
          </div>
        </div>

        {/* Children Profile Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading children profiles...</p>
          </div>
        ) : children.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Users className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No children profiles found</p>
            <p className="text-xs text-navy/40 mt-1">Contact school admissions to link your student ward</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.map((child) => (
              <GlassCard key={child.id} className="p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="flex items-start justify-between pb-4 border-b border-white/60 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-bold text-navy text-lg border border-white/60 shadow-sm">
                        {child.firstName[0]}
                        {child.lastName[0]}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-navy">
                          {child.firstName} {child.lastName}
                        </h2>
                        <p className="text-xs text-navy/60 font-mono">Admission No: {child.admissionNo}</p>
                        <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                          {child.class?.name || 'Class 10'} — Section {child.section?.name || 'A'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                      {child.status || 'ACTIVE'}
                    </span>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    <div className="p-3 rounded-2xl bg-white/50 border border-white/80">
                      <span className="text-[10px] font-semibold text-navy/50 block">Roll No</span>
                      <span className="text-sm font-bold text-navy font-mono">
                        {child.rollNo ? String(child.rollNo).padStart(2, '0') : '--'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/50 border border-white/80">
                      <span className="text-[10px] font-semibold text-navy/50 block">Attendance</span>
                      <span className="text-sm font-bold text-emerald-700">92%</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/50 border border-white/80">
                      <span className="text-[10px] font-semibold text-navy/50 block">Fee Status</span>
                      <span className="text-sm font-bold text-navy">Clear</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Navigation */}
                <div className="pt-4 border-t border-white/60 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Link href="/parent/attendance" className="block">
                    <GlassButton className="w-full text-xs py-2 flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Attendance
                    </GlassButton>
                  </Link>

                  <Link href="/parent/fees" className="block">
                    <GlassButton className="w-full text-xs py-2 flex items-center justify-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      Fee Dues
                    </GlassButton>
                  </Link>

                  <Link href="/parent/results" className="block">
                    <GlassButton className="w-full text-xs py-2 flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      Report Card
                    </GlassButton>
                  </Link>

                  <Link href="/parent/timetable" className="block">
                    <GlassButton className="w-full text-xs py-2 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Timetable
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

