'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { feeService } from '@/services/fee.service';
import {
  FileCheck,
  Search,
  Printer,
  RotateCcw,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Wallet,
} from 'lucide-react';

export default function AccountantReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [reversalModal, setReversalModal] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState('Duplicate bank transaction');
  const [reversing, setReversing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feeService.getRecentReceipts(50);
      setReceipts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load receipts ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalModal) return;

    try {
      setReversing(true);
      setError(null);
      setMessage(null);

      await feeService.reversePayment(reversalModal.id, reversalReason);
      setMessage(`Payment receipt ${reversalModal.receiptNo} was successfully reversed.`);
      setReversalModal(null);
      await loadReceipts();
    } catch (err: any) {
      setError(err.message || 'Failed to reverse payment receipt.');
    } finally {
      setReversing(false);
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      r.receiptNo?.toLowerCase().includes(q) ||
      r.student?.firstName?.toLowerCase().includes(q) ||
      r.student?.lastName?.toLowerCase().includes(q) ||
      r.student?.admissionNo?.toLowerCase().includes(q) ||
      r.referenceNo?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Fee Receipts Ledger"
        subtitle="Complete transaction audit trail of all manual fees collected"
        badge="Official Ledger"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadReceipts()}
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

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs text-emerald-700">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-rose-700">Dismiss</button>
        </div>
      )}

      {/* Search Input */}
      <GlassCard padding="md" className="border-white/80 shadow-sm mb-6">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Receipt #, Student Name, Admission No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/70 border border-white/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
          />
        </div>
      </GlassCard>

      {/* Receipts Table */}
      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Recorded Receipts</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Transactions logged: <span className="font-bold text-slate-800">{filteredReceipts.length}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading receipts ledger...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No receipts found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Student Scholar</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode & Ref</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredReceipts.map((r) => {
                  const isReversed = r.status === 'REVERSED';
                  return (
                    <tr key={r.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-indigo-700">
                        {r.receiptNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {r.student?.firstName} {r.student?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.student?.admissionNo}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">{r.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.referenceNo || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        ₹{Number(r.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isReversed
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(r)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all border border-indigo-200 flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          {!isReversed && (
                            <button
                              type="button"
                              onClick={() => setReversalModal(r)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-all border border-rose-200 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reverse</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <GlassCard padding="lg" className="max-w-md w-full bg-white/95 shadow-2xl border-white/90">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-base font-black text-slate-800">Official Fee Receipt</h4>
                <p className="text-[11px] text-slate-500 font-mono">Receipt No: {selectedReceipt.receiptNo}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Scholar:</span>
                <span className="font-bold text-slate-800">
                  {selectedReceipt.student?.firstName} {selectedReceipt.student?.lastName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono text-slate-700">{selectedReceipt.student?.admissionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-bold text-slate-700">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  ₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-600">{selectedReceipt.referenceNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-600 font-mono">{new Date(selectedReceipt.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <GlassCard padding="lg" className="max-w-md w-full bg-white/95 shadow-2xl border-white/90">
            <h4 className="text-sm font-black text-rose-700 mb-1">Reverse Payment Receipt</h4>
            <p className="text-xs text-slate-500 mb-4">
              You are about to reverse receipt <span className="font-bold text-slate-800">{reversalModal.receiptNo}</span> for ₹{Number(reversalModal.amount).toLocaleString('en-IN')}.
            </p>

            <form onSubmit={handleReversePayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason for Reversal / Refund *
                </label>
                <input
                  type="text"
                  required
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Duplicate transaction or bank bounce"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {reversing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Confirm Reversal</span>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
}

