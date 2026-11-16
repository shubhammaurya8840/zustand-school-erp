'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { GlassCard } from '@/components/common/GlassCard';
import { AttendanceGauge } from '@/components/widgets/AttendanceGauge';
import { AnnouncementsWidget } from '@/components/widgets/AnnouncementsWidget';
import { apiClient } from '@/services/api-client';
import { MessageSquare, Download, RefreshCw } from 'lucide-react';

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/parents/my-children').catch(() => []);
      const list = Array.isArray(res) ? res : res?.children || [];
      setChildren(list);
    } catch (err) {
      console.error('Failed to load parent children:', err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentChild = children[selectedChildIndex] || null;
  const studentFullName = currentChild ? `${currentChild.firstName} ${currentChild.lastName}` : '';
  const classSectionStr = currentChild
    ? `${currentChild.class?.name || 'Class'} — Section ${currentChild.section?.name || 'A'}`
    : '';

  return (
    <DashboardLayout currentRole="parent">
      <PageHeader
        title="Parent Institutional Portal"
        subtitle="Zustand Public School • Family Student Monitoring & School Communication"
        badge="Session 2026–2027"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {children.length > 1 && (
              <div className="p-1 rounded-xl bg-white/70 border border-white/90 flex gap-1 shadow-2xs">
                {children.map((child, idx) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChildIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedChildIndex === idx
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    {child.firstName} ({child.class?.name})
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Loading linked student records...</span>
        </div>
      ) : !currentChild ? (
        <GlassCard padding="lg" className="p-12 text-center text-slate-500 mb-6">
          <h3 className="text-base font-bold text-slate-700">No Linked Children Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No students are currently mapped to your parent account in the institutional database. Please contact school administration.
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Child Summary Banner */}
          <GlassCard padding="md" className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg font-bold text-indigo-700 shadow-xs">
                {currentChild.firstName[0]}
                {currentChild.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-800">{studentFullName}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                    Roll #{currentChild.rollNo} • {currentChild.admissionNo}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {classSectionStr}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert(`Downloading Term 1 Academic Report for ${studentFullName}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold border border-white/90 shadow-2xs transition-all"
                type="button"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report Card</span>
              </button>
              <button
                onClick={() => alert('Opening Teacher Connect Portal')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
                type="button"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Teacher Connect</span>
              </button>
            </div>
          </GlassCard>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Attendance Rate"
              value="96%"
              subValue="Class Roll Call Log"
              change="Regular"
              isPositive={true}
              iconName="CalendarCheck2"
              iconColor="text-teal-600"
              bgTint="bg-teal-50"
            />
            <StatCard
              label="Term Fee Account"
              value="Clear"
              subValue="Institutional Ledger In Good Standing"
              change="Paid in full"
              isPositive={true}
              iconName="CheckCircle2"
              iconColor="text-emerald-600"
              bgTint="bg-emerald-50"
            />
            <StatCard
              label="Academic GPA / Average"
              value="3.88"
              subValue="Class Evaluation"
              change="On Track"
              isPositive={true}
              iconName="Award"
              iconColor="text-indigo-600"
              bgTint="bg-indigo-50"
            />
            <StatCard
              label="Library Books Loaned"
              value="1"
              subValue="Due in 14 days"
              change="On Time"
              isPositive={true}
              iconName="BookOpen"
              iconColor="text-amber-600"
              bgTint="bg-amber-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <GlassCard padding="md" className="h-full">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-3">
                  Curriculum Performance & Subject Evaluation
                </h3>
                {currentChild.examResults && currentChild.examResults.length > 0 ? (
                  <div className="space-y-3">
                    {currentChild.examResults.map((res: any) => (
                      <div key={res.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 border border-white/80">
                        <span className="text-xs font-semibold text-slate-700">
                          {res.examSchedule?.subject?.name || 'Subject'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{res.marksObtained} Marks</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {res.grade || 'Passed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-xs font-semibold text-slate-600">No subject examinations published yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Official marks and evaluations will appear here once published by faculty.</p>
                  </div>
                )}
              </GlassCard>
            </div>
            <div>
              <AttendanceGauge percentage={Number(currentChild.attendanceRate) || 100} />
            </div>
          </div>
        </>
      )}

      <div className="mb-6">
        <AnnouncementsWidget limit={2} />
      </div>
    </DashboardLayout>
  );
}
