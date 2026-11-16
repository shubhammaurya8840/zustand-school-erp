'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { libraryService } from '@/services/library.service';
import {
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Phone,
} from 'lucide-react';

export default function LibrarianOverduePage() {
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverdue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await libraryService.getOverdue(50);
      setOverdueList(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load overdue list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverdue();
  }, []);

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Overdue Loans Tracker"
        subtitle="Monitor delinquent book returns, accrued fines and borrower contact details"
        badge="Overdue Desk"
        actions={
          <button
            onClick={() => loadOverdue()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Overdue Library Accounts</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Overdue titles: <span className="font-bold text-rose-600">{overdueList.length}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Scanning overdue circulation database...</p>
          </div>
        ) : overdueList.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800">No overdue books!</h4>
            <p className="text-xs text-slate-500 mt-1">All borrowed books are currently within their permitted loan window.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Book Title & Barcode</th>
                  <th className="py-3 px-4">Borrower & Class</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Guardian / Contact</th>
                  <th className="py-3 px-4 text-center">Accrued Fine</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {overdueList.map((item) => {
                  const dueDate = new Date(item.dueDate);
                  const daysLate = Math.max(1, Math.floor((Date.now() - dueDate.getTime()) / 86400000));
                  const calculatedFine = daysLate * 10;

                  return (
                    <tr key={item.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.book?.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Barcode: {item.book?.barcode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">
                          {item.student ? `${item.student.firstName} ${item.student.lastName}` : item.staff ? `${item.staff.firstName} ${item.staff.lastName}` : 'Member'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.student ? `${item.student.admissionNo} • ${item.student.class?.name || 'Class 10'}` : item.staff?.employeeId}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600 font-bold text-[11px]">
                        {dueDate.toLocaleDateString('en-IN')} ({daysLate}d late)
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.student?.parent?.primaryPhone || item.staff?.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                          ₹{calculatedFine}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/librarian/returns"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3 text-emerald-400" />
                          <span>Return</span>
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

