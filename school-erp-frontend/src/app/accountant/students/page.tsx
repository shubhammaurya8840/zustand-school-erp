'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { studentService, StudentListItem } from '@/services/student.service';
import { feeService } from '@/services/fee.service';
import {
  Users,
  Search,
  Wallet,
  Receipt,
  FileText,
  Loader2,
  RefreshCw,
  X,
  UserPlus,
  Trash2,
} from 'lucide-react';

export default function AccountantStudentsPage() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLedgerStudent, setSelectedLedgerStudent] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<any | null>(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAll({
        search: search.trim() || undefined,
        limit: 100,
      });
      setStudents(res.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const openLedgerModal = async (student: StudentListItem) => {
    try {
      setSelectedLedgerStudent(student);
      setLedgerLoading(true);
      const data = await feeService.getStudentLedger(student.id);
      setLedgerData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleDeleteStudent = async (student: StudentListItem) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete student ${student.firstName} ${student.lastName} (${student.admissionNo})?\n\nThis will remove their scholar enrollment, attendance records, exam results, fee ledger, and portal login account.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await studentService.delete(student.id);
      await loadStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Student Fee Accounts & Ledgers"
        subtitle="Individual scholar billing status, recorded receipts and fee heads"
        badge="Scholar Accounting"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/accountant/students/admission"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Admission</span>
            </Link>
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

      <GlassCard padding="md" className="border-white/80 shadow-sm mb-6">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Admission #, Roll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-white/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Search
          </button>
        </form>
      </GlassCard>

      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40">
          <h3 className="text-sm font-black text-slate-800">Enrolled Scholar Directory</h3>
          <p className="text-[11px] text-slate-500 font-medium">All students active in current academic session</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No students found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4 text-center">Fee Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {students.map((stu) => {
                  const fee = stu.fees?.[0];
                  const status = fee ? fee.status : 'PENDING';

                  return (
                    <tr key={stu.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {stu.firstName} {stu.lastName}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {stu.admissionNo}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {stu.class?.name || 'Class 10'} — {stu.section?.name || 'A'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {stu.parent?.primaryPhone || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openLedgerModal(stu)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Ledger</span>
                          </button>
                          <Link
                            href={`/accountant/fees/collect?studentId=${stu.id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                          >
                            <Wallet className="w-3 h-3 text-emerald-400" />
                            <span>Collect</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(stu)}
                            title="Delete Scholar Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Ledger Modal */}
      {selectedLedgerStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <GlassCard padding="lg" className="max-w-xl w-full bg-white/95 shadow-2xl border-white/90">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  Fee Ledger: {selectedLedgerStudent.firstName} {selectedLedgerStudent.lastName}
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedLedgerStudent.admissionNo} • {selectedLedgerStudent.class?.name || 'Class 10-A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedLedgerStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ledgerLoading ? (
              <div className="py-16 flex justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="py-4 space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Assessed</div>
                    <div className="text-sm font-black text-slate-800 mt-0.5">
                      ₹{Number(ledgerData?.totalFeeAmount || 25000).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-600 uppercase font-bold">Total Paid</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">
                      ₹{Number(ledgerData?.paidAmount || 12500).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="text-[10px] text-rose-600 uppercase font-bold">Balance Due</div>
                    <div className="text-sm font-black text-rose-700 mt-0.5">
                      ₹{Number(ledgerData?.dueAmount || 12500).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-slate-700 mb-2">Recorded Payment History</h5>
                  {ledgerData?.payments?.length === 0 ? (
                    <p className="text-slate-400 italic">No payments recorded yet for this scholar.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {(ledgerData?.payments || []).map((p: any) => (
                        <div key={p.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                          <div>
                            <span className="font-mono font-bold text-indigo-700">{p.receiptNo}</span>
                            <span className="text-slate-400 text-[10px] ml-2 font-mono">
                              {new Date(p.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">{p.paymentMethod}</span>
                            <span className="font-mono font-black text-emerald-700">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLedgerStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
}

