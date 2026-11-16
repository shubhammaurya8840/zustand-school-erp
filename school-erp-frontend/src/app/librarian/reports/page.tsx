'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { StatCard } from '@/components/common/StatCard';
import { reportService } from '@/services/report.service';
import { libraryService } from '@/services/library.service';
import {
  BarChart3,
  BookOpen,
  CalendarCheck2,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function LibrarianReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [circulation, setCirculation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [metricRes, circRes] = await Promise.all([
        reportService.getLibraryDashboard().catch(() => null),
        libraryService.getCirculation(undefined, 20).catch(() => []),
      ]);
      setMetrics(metricRes);
      setCirculation(circRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Library Analytics & Circulation Reports"
        subtitle="Institutional loan trends, overdue fine collections and reader turnover"
        badge="Analytics"
        actions={
          <button
            onClick={() => loadReports()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Titles"
          value={metrics?.totalBooks || 2}
          subValue="Registered in catalog"
          change="Catalogued"
          isPositive={true}
          iconName="BookMarked"
          iconColor="text-indigo-600"
          bgTint="bg-indigo-50"
        />
        <StatCard
          label="Total Volumes"
          value={metrics?.totalCopies || 10}
          subValue="Physical inventory"
          change="On Campus"
          isPositive={true}
          iconName="Layers"
          iconColor="text-emerald-600"
          bgTint="bg-emerald-50"
        />
        <StatCard
          label="Active Loans"
          value={metrics?.activeIssues || circulation.filter((c) => c.status === 'ISSUED').length}
          subValue="Currently checked out"
          change="Circulating"
          isPositive={true}
          iconName="BookOpen"
          iconColor="text-amber-600"
          bgTint="bg-amber-50"
        />
        <StatCard
          label="Overdue Volume Rate"
          value={`${metrics?.overdueRate || 0}%`}
          subValue="Loan recovery health"
          change="Audited"
          isPositive={true}
          iconName="CalendarCheck2"
          iconColor="text-teal-600"
          bgTint="bg-teal-50"
        />
      </div>

      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40">
          <h3 className="text-sm font-black text-slate-800">Recent Circulation History</h3>
          <p className="text-[11px] text-slate-500 font-medium">Logged checkout and return transactions</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Generating circulation telemetry...</p>
          </div>
        ) : circulation.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">No recent transactions recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Return / Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {circulation.map((c) => (
                  <tr key={c.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{c.book?.title}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {c.student ? `${c.student.firstName} ${c.student.lastName}` : c.staff ? `${c.staff.firstName} ${c.staff.lastName}` : 'Member'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {new Date(c.issuedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {c.returnedAt ? new Date(c.returnedAt).toLocaleDateString('en-IN') : new Date(c.dueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'RETURNED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      ₹{Number(c.fineAmount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </DashboardLayout>
  );
}

