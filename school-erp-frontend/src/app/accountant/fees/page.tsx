'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { feeService } from '@/services/fee.service';
import { masterDataService } from '@/services/master-data.service';
import {
  Wallet,
  Receipt,
  PlusCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function AccountantFeesPage() {
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeeData = async () => {
    try {
      setLoading(true);
      const [headsRes, structRes] = await Promise.all([
        feeService.getHeads().catch(() => []),
        feeService.getStructures().catch(() => []),
      ]);
      setFeeHeads(headsRes || []);
      setStructures(structRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, []);

  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Fee Heads & Structure Configuration"
        subtitle="Standard institutional billing heads, frequencies and class-wise fee schedules"
        badge="Bursar Treasury"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadFeeData()}
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

      {/* Standard Fee Heads Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <GlassCard padding="none" className="border-white/80 shadow-md overflow-hidden">
            <div className="p-4 border-b border-white/60 bg-white/40">
              <h3 className="text-sm font-black text-slate-800">Master Fee Heads</h3>
              <p className="text-[11px] text-slate-500 font-medium">Standard tuition & institutional charges</p>
            </div>
            {loading ? (
              <div className="py-12 flex justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="divide-y divide-white/40 text-xs">
                {feeHeads.map((fh) => (
                  <div key={fh.id} className="p-3.5 flex items-center justify-between hover:bg-white/40 transition-colors">
                    <div>
                      <div className="font-bold text-slate-800">{fh.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Code: {fh.code}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fh.isRefundable
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {fh.isRefundable ? 'Refundable' : 'Standard'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Class Fee Structures */}
        <div className="md:col-span-2">
          <GlassCard padding="none" className="border-white/80 shadow-md overflow-hidden">
            <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Class Fee Structures</h3>
                <p className="text-[11px] text-slate-500 font-medium">Session 2026–2027 Approved Tuition Rates</p>
              </div>
              <Link
                href="/accountant/fees/dues"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Defaulters →
              </Link>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : structures.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <FileCheck className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                <p>Standard class structures are applied on term admissions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Fee Head</th>
                      <th className="py-3 px-4">Frequency</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {structures.map((s) => (
                      <tr key={s.id} className="hover:bg-white/40">
                        <td className="py-3 px-4 font-bold text-slate-800">{s.class?.name}</td>
                        <td className="py-3 px-4 text-slate-700">{s.feeHead?.name}</td>
                        <td className="py-3 px-4 text-slate-500">{s.frequency || 'Quarterly'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                          ₹{Number(s.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

