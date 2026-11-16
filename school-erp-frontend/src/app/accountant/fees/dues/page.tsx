'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { feeService } from '@/services/fee.service';
import { masterDataService, ClassItem } from '@/services/master-data.service';
import {
  AlertTriangle,
  Search,
  Phone,
  RefreshCw,
  Loader2,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

export default function AccountantDuesPage() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadDues = async () => {
    try {
      setLoading(true);
      const [dueRes, clsRes] = await Promise.all([
        feeService.getDefaulters(selectedClassId || undefined).catch(() => []),
        masterDataService.getClasses().catch(() => []),
      ]);
      setDefaulters(dueRes || []);
      setClasses(clsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDues();
  }, [selectedClassId]);

  const totalDuesAmount = defaulters.reduce((acc, d) => acc + Number(d.dueAmount || d.fees?.[0]?.dueAmount || 0), 0);

  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Fee Defaulters & Outstanding Dues"
        subtitle="Scholars with pending fee balances across academic terms"
        badge="Collections Desk"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDues()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/accountant/fees/collect"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Collect Fee</span>
            </Link>
          </div>
        }
      />

      {/* Class Filter Bar */}
      <GlassCard padding="md" className="border-white/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Filter by Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding Balance</div>
          <div className="text-xl font-black text-rose-600 font-mono">
            ₹{totalDuesAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </GlassCard>

      {/* Defaulters Table */}
      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40">
          <h3 className="text-sm font-black text-slate-800">Pending Fee Accounts</h3>
          <p className="text-[11px] text-slate-500 font-medium">Scholars with due payments</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Auditing fee ledgers...</p>
          </div>
        ) : defaulters.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800">No overdue fee accounts!</h4>
            <p className="mt-1">All enrolled students in the selected class are currently in good standing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student Scholar</th>
                  <th className="py-3 px-4">Enrolled Class</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Pending Due</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {defaulters.map((d) => {
                  const due = d.dueAmount || d.fees?.[0]?.dueAmount || 0;
                  const paid = d.paidAmount || d.fees?.[0]?.paidAmount || 0;

                  return (
                    <tr key={d.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{d.firstName} {d.lastName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.admissionNo}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{d.class?.name || 'Class 10-A'}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">{d.parent?.fatherName || 'Parent'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.parent?.primaryPhone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        ₹{Number(paid).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600 text-sm">
                        ₹{Number(due).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/accountant/fees/collect?studentId=${d.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1"
                        >
                          <Wallet className="w-3 h-3 text-emerald-400" />
                          <span>Collect</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </DashboardLayout>
  );
}

