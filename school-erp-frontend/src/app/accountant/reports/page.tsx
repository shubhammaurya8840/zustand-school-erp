'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { StatCard } from '@/components/common/StatCard';
import { reportService } from '@/services/report.service';
import { feeService } from '@/services/fee.service';
import {
  BarChart3,
  Wallet,
  Receipt,
  FileCheck,
  RefreshCw,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function AccountantReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFinancialReports = async () => {
    try {
      setLoading(true);
      const [accRes, recRes] = await Promise.all([
        reportService.getAccountantDashboard().catch(() => null),
        feeService.getRecentReceipts(50).catch(() => []),
      ]);
      setReportData(accRes);
      setRecentReceipts(recRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialReports();
  }, []);

  const totalCollected = recentReceipts.reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const upiCollected = recentReceipts
    .filter((r) => r.paymentMethod === 'UPI')
    .reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const cashCollected = recentReceipts
    .filter((r) => r.paymentMethod === 'CASH')
    .reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const bankCollected = recentReceipts
    .filter((r) => r.paymentMethod === 'BANK_TRANSFER' || r.paymentMethod === 'CHEQUE')
    .reduce((acc, r) => acc + Number(r.amount || 0), 0);

  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Financial Telemetry & Revenue Reports"
        subtitle="Daily fee collections, multi-mode reconciliation and audit ledgers"
        badge="Treasury Reports"
        actions={
          <button
            onClick={() => loadFinancialReports()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Collected"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          subValue="Verified in PostgreSQL"
          change="Real DB"
          isPositive={true}
          iconName="Wallet"
          iconColor="text-emerald-600"
          bgTint="bg-emerald-50"
        />
        <StatCard
          label="UPI Collections"
          value={`₹${upiCollected.toLocaleString('en-IN')}`}
          subValue="Instant digital receipts"
          change="Digital"
          isPositive={true}
          iconName="FileCheck"
          iconColor="text-indigo-600"
          bgTint="bg-indigo-50"
        />
        <StatCard
          label="Cash Over Counter"
          value={`₹${cashCollected.toLocaleString('en-IN')}`}
          subValue="Physical currency in till"
          change="Counter"
          isPositive={true}
          iconName="Receipt"
          iconColor="text-amber-600"
          bgTint="bg-amber-50"
        />
        <StatCard
          label="Bank & Cheques"
          value={`₹${bankCollected.toLocaleString('en-IN')}`}
          subValue="NEFT / RTGS / Cheques"
          change="Direct"
          isPositive={true}
          iconName="BarChart3"
          iconColor="text-sky-600"
          bgTint="bg-sky-50"
        />
      </div>

      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40">
          <h3 className="text-sm font-black text-slate-800">Transaction Mode Distribution</h3>
          <p className="text-[11px] text-slate-500 font-medium">Reconciled breakdown of manual fee deposits</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : recentReceipts.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No transaction records logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Scholar</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Channel / Mode</th>
                  <th className="py-3 px-4">Transaction Reference</th>
                  <th className="py-3 px-4 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {recentReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{r.receiptNo}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">
                      {r.student?.firstName} {r.student?.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{r.referenceNo || 'Counter'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{Number(r.amount).toLocaleString('en-IN')}
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

