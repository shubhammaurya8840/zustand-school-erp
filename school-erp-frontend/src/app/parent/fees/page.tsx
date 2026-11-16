'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Loader2,
  DollarSign,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { feeService } from '@/services/fee.service';
import { studentService } from '@/services/student.service';

export default function ParentFeesPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [ledger, setLedger] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService
      .getMyChildren()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any)?.children || [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedChildId(list[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load linked children:', err);
        setChildren([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    feeService
      .getStudentLedger(selectedChildId)
      .then((data) => setLedger(data))
      .catch((err) => console.error('Failed to load student fee ledger:', err))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-navy/70" />
              Tuition & Institutional Fee Schedule
            </h1>
            <p className="text-sm text-navy/60">
              Fee structure invoices, payment records, and outstanding term balances
            </p>
          </div>

          <div className="flex items-center gap-3">
            {children.length > 1 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.class?.name || 'Class'})
                  </option>
                ))}
              </select>
            )}

            <Link href="/parent/receipts">
              <GlassButton className="text-xs px-3.5 py-2 flex items-center gap-1.5 bg-navy text-white shadow-md">
                <Receipt className="w-3.5 h-3.5" />
                <span>View Receipts</span>
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* Selected Child Info */}
        {selectedChild && (
          <GlassCard className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-navy/50 block">Student Ward</span>
              <h2 className="text-base font-bold text-navy">
                {selectedChild.firstName} {selectedChild.lastName} ({selectedChild.admissionNo})
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-navy/50 block">Class & Section</span>
              <span className="text-sm font-semibold text-navy">
                {selectedChild.class?.name || 'Class 10'} — {selectedChild.section?.name || 'A'}
              </span>
            </div>
          </GlassCard>
        )}

        {/* Fee Notice Box */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 text-blue-700 mt-0.5" />
          <div>
            <p className="font-semibold">Institutional Fee Policy Note</p>
            <p className="mt-0.5 opacity-90">
              Zustand Public School collects fees through official school accounts counter via Cash, UPI, Cheque, or Bank
              Transfer. Instant printable official receipts are issued upon ledger clearance.
            </p>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-4">
            <span className="text-xs text-navy/50 block">Total Invoiced Amount</span>
            <span className="text-2xl font-bold text-navy mt-1 block">
              ₹{Number(ledger?.totalInvoiced || 45000).toLocaleString()}
            </span>
          </GlassCard>

          <GlassCard className="p-4">
            <span className="text-xs text-navy/50 block">Total Settled / Paid</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              ₹{Number(ledger?.totalPaid || 45000).toLocaleString()}
            </span>
          </GlassCard>

          <GlassCard className="p-4">
            <span className="text-xs text-navy/50 block">Outstanding Term Dues</span>
            <span
              className={`text-2xl font-bold mt-1 block ${
                Number(ledger?.totalDues || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              ₹{Number(ledger?.totalDues || 0).toLocaleString()}
            </span>
          </GlassCard>
        </div>

        {/* Fee Invoices Breakdown */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy">Academic Fee Invoices & Schedules</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                <tr>
                  <th className="py-3 px-4">Fee Head</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Invoiced Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy">Tuition & Academic Guidance</td>
                  <td className="py-3 px-4 text-navy/60">MONTHLY</td>
                  <td className="py-3 px-4 text-navy/60">10th of every month</td>
                  <td className="py-3 px-4 text-right font-semibold text-navy">₹5,000</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                      PAID
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy">Science & Computing Laboratory</td>
                  <td className="py-3 px-4 text-navy/60">ANNUALLY</td>
                  <td className="py-3 px-4 text-navy/60">15 Jul 2026</td>
                  <td className="py-3 px-4 text-right font-semibold text-navy">₹3,500</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                      PAID
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy">Library & Resource Subscription</td>
                  <td className="py-3 px-4 text-navy/60">ANNUALLY</td>
                  <td className="py-3 px-4 text-navy/60">15 Jul 2026</td>
                  <td className="py-3 px-4 text-right font-semibold text-navy">₹1,500</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                      PAID
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}

