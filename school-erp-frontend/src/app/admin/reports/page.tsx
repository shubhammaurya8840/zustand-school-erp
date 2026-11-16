'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { reportService, AdminDashboardData } from '@/services/report.service';

export default function AdminReportsPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await reportService.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-navy/70" />
              Institutional Analytics & Executive Reports
            </h1>
            <p className="text-sm text-navy/60">
              High-fidelity institutional telemetry, cohort strength distribution, and financial receipts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => window.print()}
              className="text-xs px-3.5 py-2 flex items-center gap-1.5 bg-navy text-white shadow-md hover:bg-navy/90"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </GlassButton>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Compiling institutional telemetry...</p>
          </div>
        ) : !data ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <p className="font-semibold text-navy">Telemetry temporarily unavailable</p>
          </GlassCard>
        ) : (
          <>
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-navy/50 block">Enrolled Students</span>
                  <span className="text-xl font-bold text-navy">{data.kpi.totalStudents}</span>
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-navy/50 block">Faculty & Staff</span>
                  <span className="text-xl font-bold text-navy">
                    {data.kpi.totalTeachers} Teachers / {data.kpi.totalStaff} Total
                  </span>
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-navy/50 block">Total Fee Collection</span>
                  <span className="text-xl font-bold text-emerald-700">
                    ₹{Number(data.kpi.totalFeeCollection).toLocaleString()}
                  </span>
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-navy/50 block">Outstanding Fee Dues</span>
                  <span className="text-xl font-bold text-rose-700">
                    ₹{Number(data.kpi.totalPendingDues).toLocaleString()}
                  </span>
                </div>
              </GlassCard>
            </div>

            {/* Attendance & Strength Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Strength Table */}
              <GlassCard className="p-5">
                <h3 className="font-bold text-base text-navy mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-navy/70" />
                  Cohort Strength Distribution
                </h3>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/40 text-navy/60 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3 text-right">Student Strength</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {data.classStrengthDistribution.map((item) => (
                        <tr key={item.classId} className="hover:bg-white/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-navy">{item.className}</td>
                          <td className="py-2.5 px-3 font-mono text-navy/60">{item.code}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-navy">
                            {item.studentCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Recent Financial Receipts Inflows */}
              <GlassCard className="p-5">
                <h3 className="font-bold text-base text-navy mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-navy/70" />
                  Recent Fee Inflows & Receipts
                </h3>

                {data.recentPayments.length === 0 ? (
                  <p className="text-xs text-navy/40 italic py-6 text-center">No fee receipts logged yet</p>
                ) : (
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/40 text-navy/60 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Receipt No</th>
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5">
                        {data.recentPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-white/30 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-navy">{p.receiptNo}</td>
                            <td className="py-2.5 px-3 font-medium text-navy/80">{p.studentName}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy/5 text-navy/70">
                                {p.method}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              ₹{Number(p.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

