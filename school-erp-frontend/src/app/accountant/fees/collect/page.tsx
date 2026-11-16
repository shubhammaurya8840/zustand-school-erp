'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { feeService } from '@/services/fee.service';
import { studentService, StudentListItem } from '@/services/student.service';
import {
  Wallet,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Receipt,
  Search,
} from 'lucide-react';

function CollectFeeContent() {
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId') || '';

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [amount, setAmount] = useState<number>(12500);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'>('UPI');
  const [referenceNo, setReferenceNo] = useState<string>('UPI-REF-' + Math.floor(100000 + Math.random() * 900000));
  const [remarks, setRemarks] = useState<string>('Tuition & Composite Term Fee');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await studentService.getAll({ limit: 100 });
        const list = res.students || [];
        setStudents(list);

        if (preselectedStudentId) {
          setSelectedStudentId(preselectedStudentId);
        } else if (list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load student registry.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [preselectedStudentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student.');
      return;
    }
    if (Number(amount) <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setReceiptData(null);

      const receipt = await feeService.collectFee({
        studentId: selectedStudentId,
        amount: Number(amount),
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      setReceiptData(receipt);
    } catch (err: any) {
      setError(err.message || 'Payment collection transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Card */}
      <GlassCard padding="lg" className="border-white/80 shadow-md">
        <h3 className="text-sm font-black text-slate-800 mb-1">Fee Collection Terminal</h3>
        <p className="text-[11px] text-slate-500 mb-4">Record manual on-counter or institutional transaction</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading student roster...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Student Scholar *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} (Roll #{s.rollNo} • {s.admissionNo}) — {s.class?.name || 'Class 10'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Collection Amount (INR ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/RTGS)</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Transaction / Reference / Cheque No
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-98437298 or CHQ-004812"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Receipt Remarks / Note
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing Payment Record...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Record Payment & Generate Official Receipt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </GlassCard>

      {/* Generated Receipt Preview */}
      <div>
        {receiptData ? (
          <GlassCard padding="lg" className="border-emerald-200 bg-white/90 shadow-xl print:m-0">
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-800">Fee Payment Confirmed</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Receipt No: <span className="font-bold text-slate-800">{receiptData.receiptNo}</span>
              </p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Scholar:</span>
                <span className="font-bold text-slate-800">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono text-slate-700">{selectedStudent?.admissionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Class & Section:</span>
                <span className="font-semibold text-slate-800">{selectedStudent?.class?.name || 'Class 10-A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  ₹{Number(receiptData.amount || amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-bold text-slate-700">{receiptData.paymentMethod || paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-600">{receiptData.referenceNo || referenceNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date & Timestamp:</span>
                <span className="text-slate-600 font-mono">{new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <Link
                href="/accountant/fees/receipts"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Receipts Ledger →
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard padding="lg" className="border-white/80 text-center py-20">
            <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <h4 className="text-sm font-bold text-slate-800">No Receipt Generated Yet</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Select a student, configure collection amount and submit the payment to generate an institutional receipt.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

export default function AccountantCollectFeePage() {
  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Fee Collection Register"
        subtitle="Record fee receipts with real-time PostgreSQL database persistence"
        badge="Manual Collection Desk"
        actions={
          <Link
            href="/accountant/fees/receipts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
          >
            <span>Receipts Ledger</span>
          </Link>
        }
      />
      <Suspense fallback={<div className="text-xs text-slate-500">Loading payment terminal...</div>}>
        <CollectFeeContent />
      </Suspense>
    </DashboardLayout>
  );
}

