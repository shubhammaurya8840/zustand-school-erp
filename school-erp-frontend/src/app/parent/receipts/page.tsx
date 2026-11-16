'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Printer,
  X,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Loader2,
  School,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { feeService } from '@/services/fee.service';
import { studentService } from '@/services/student.service';

export default function ParentReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    studentService
      .getMyChildren()
      .then(async (children) => {
        const list = Array.isArray(children) ? children : (children as any)?.children || [];
        if (list.length === 0) {
          setReceipts([]);
          return;
        }
        const ledgerPromises = list.map((child: any) =>
          feeService.getStudentLedger(child.id).catch(() => null)
        );
        const ledgers = await Promise.all(ledgerPromises);
        const allReceipts: any[] = [];
        ledgers.forEach((led, idx) => {
          if (led && Array.isArray(led.payments)) {
            led.payments.forEach((p: any) => {
              allReceipts.push({
                ...p,
                student: list[idx],
              });
            });
          }
        });
        setReceipts(allReceipts);
      })
      .catch((err) => {
        console.error('Failed to load receipts for mapped children:', err);
        setReceipts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Receipt className="w-7 h-7 text-navy/70" />
              Official Fee Receipts Ledger
            </h1>
            <p className="text-sm text-navy/60">
              Download and print verifiable institutional fee clearance receipts
            </p>
          </div>
        </div>

        {/* Receipts Table */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy">Settled Receipts ({receipts.length})</h3>
            <span className="text-xs text-navy/50">Click "Print Receipt" to view formal invoice</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading fee receipts...</p>
            </div>
          ) : receipts.length === 0 ? (
            <div className="p-12 text-center text-navy/50">
              <Receipt className="w-10 h-10 mx-auto text-navy/20 mb-2" />
              <p className="font-semibold text-navy">No receipts issued yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                  <tr>
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference / UTR</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {receipts.map((rc) => (
                    <tr key={rc.id} className="hover:bg-white/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy">{rc.receiptNo}</td>
                      <td className="py-3 px-4 font-semibold text-navy">
                        {rc.student ? `${rc.student.firstName} ${rc.student.lastName}` : 'Student'}
                      </td>
                      <td className="py-3 px-4 text-navy/60">
                        {new Date(rc.paidAt || rc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy/5 text-navy/70">
                          {rc.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-navy/60">{rc.referenceNo || 'OFFLINE'}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ₹{Number(rc.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <GlassButton
                          onClick={() => setSelectedReceipt(rc)}
                          className="text-xs px-2.5 py-1 flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </GlassButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Printable Receipt Modal */}
        <AnimatePresence>
          {selectedReceipt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/80 space-y-4"
              >
                <div className="flex items-start justify-between border-b border-navy/10 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-navy">Zustand Public School</h2>
                    <p className="text-xs text-navy/60">Official Accounts & Fee Receipt</p>
                    <p className="text-xs font-mono font-bold text-navy mt-1">
                      Receipt #: {selectedReceipt.receiptNo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-xl bg-navy/5 hover:bg-navy/10 text-navy"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedReceipt(null)}
                      className="p-2 rounded-xl bg-navy/5 hover:bg-navy/10 text-navy"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-navy/80">
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-navy/5">
                    <div>
                      <span className="text-navy/50 block text-[11px]">Student Name:</span>
                      <span className="font-bold text-navy">
                        {selectedReceipt.student
                          ? `${selectedReceipt.student.firstName} ${selectedReceipt.student.lastName}`
                          : 'Student'}
                      </span>
                    </div>
                    <div>
                      <span className="text-navy/50 block text-[11px]">Admission No:</span>
                      <span className="font-mono font-semibold text-navy">
                        {selectedReceipt.student?.admissionNo || '--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-navy/50 block text-[11px]">Date Paid:</span>
                      <span className="font-medium text-navy">
                        {new Date(selectedReceipt.paidAt || selectedReceipt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-navy/50 block text-[11px]">Payment Mode:</span>
                      <span className="font-semibold text-navy">{selectedReceipt.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <span className="font-bold text-navy">Total Settled Amount</span>
                    <span className="text-xl font-bold text-emerald-800">
                      ₹{Number(selectedReceipt.amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[11px] text-navy/50 pt-2 border-t border-navy/10 flex items-center justify-between">
                    <span>Authorized Institutional Stamp</span>
                    <span className="font-semibold text-emerald-700">VERIFIED CLEARANCE</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

