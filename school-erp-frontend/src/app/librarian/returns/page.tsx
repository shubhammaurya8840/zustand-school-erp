'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { libraryService } from '@/services/library.service';
import {
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function LibrarianReturnsPage() {
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadIssued = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await libraryService.getCirculation('ISSUED', 50);
      setIssuedBooks(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load issued books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssued();
  }, []);

  const handleReturn = async (issueId: string, bookTitle: string, isOverdue: boolean) => {
    try {
      setReturningId(issueId);
      setError(null);
      setMessage(null);

      const fine = isOverdue ? 50 : 0;
      await libraryService.returnBook(issueId, {
        fineAmount: fine,
        finePaid: true,
        remarks: isOverdue ? 'Overdue return with ₹50 fee' : 'Normal return on time',
      });

      setMessage(`Book "${bookTitle}" returned successfully.${fine > 0 ? ' Late fee of ₹50 collected.' : ''}`);
      await loadIssued();
    } catch (err: any) {
      setError(err.message || 'Failed to process return.');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Circulation Returns Desk"
        subtitle="Process return of issued library books and settle overdue accounts"
        badge="Returns Processing"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadIssued()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/librarian/issue"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Issue Book</span>
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

      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Active Borrowed Copies</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Currently checked out: <span className="font-bold text-slate-800">{issuedBooks.length}</span> titles
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading active circulation transactions...</p>
          </div>
        ) : issuedBooks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800">No active book loans</h4>
            <p className="text-xs text-slate-500 mt-1">All borrowed copies have been safely returned to the library shelves.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Book Title & Barcode</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Loan Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {issuedBooks.map((item) => {
                  const dueDate = new Date(item.dueDate);
                  const isOverdue = dueDate.getTime() < Date.now();

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
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {new Date(item.issuedAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {dueDate.toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue (₹50 Fine)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>Within Loan Period</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleReturn(item.id, item.book?.title || 'Book', isOverdue)}
                          disabled={returningId === item.id}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
                        >
                          {returningId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3 text-emerald-400" />}
                          <span>Process Return</span>
                        </button>
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

