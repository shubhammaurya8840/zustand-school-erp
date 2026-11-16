'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { libraryService, BookItem } from '@/services/library.service';
import { studentService, StudentListItem } from '@/services/student.service';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Barcode,
  Search,
} from 'lucide-react';

function IssueBookContent() {
  const searchParams = useSearchParams();
  const presetBarcode = searchParams.get('barcode') || '';

  const [books, setBooks] = useState<BookItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loanDays, setLoanDays] = useState<number>(14);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookRes, stuRes] = await Promise.all([
          libraryService.getBooks({ limit: 100 }).catch(() => ({ books: [], total: 0 })),
          studentService.getAll({ limit: 100 }).catch(() => ({ students: [], total: 0 })),
        ]);

        const availBooks = (bookRes.books || []).filter((b) => b.availableCopies > 0);
        setBooks(availBooks);
        setStudents(stuRes.students || []);

        if (presetBarcode) {
          const match = (bookRes.books || []).find((b) => b.barcode === presetBarcode);
          if (match) setSelectedBookId(match.id);
        } else if (availBooks.length > 0) {
          setSelectedBookId(availBooks[0].id);
        }

        if (stuRes.students?.length > 0) {
          setSelectedStudentId(stuRes.students[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load circulation reference data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [presetBarcode]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedStudentId) {
      setError('Please select both a valid available book and a registered borrower.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      await libraryService.issueBook({
        bookId: selectedBookId,
        studentId: selectedStudentId,
        loanDays: Number(loanDays) || 14,
      });

      const book = books.find((b) => b.id === selectedBookId);
      const stu = students.find((s) => s.id === selectedStudentId);

      setMessage(`Successfully issued "${book?.title}" to ${stu?.firstName} ${stu?.lastName} for ${loanDays} days.`);

      // Refresh available copies
      const refreshed = await libraryService.getBooks({ limit: 100 });
      setBooks((refreshed.books || []).filter((b) => b.availableCopies > 0));
    } catch (err: any) {
      setError(err.message || 'Book issue transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <GlassCard padding="lg" className="border-white/80 shadow-md">
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading book titles and student registry...</p>
          </div>
        ) : (
          <form onSubmit={handleIssue} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Book Title (Available Copies Only) *
              </label>
              {books.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
                  No copies currently available in stock for loan.
                </div>
              ) : (
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} • {b.barcode} ({b.availableCopies} available)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Borrower (Student) *
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
                  Loan Duration (Days) *
                </label>
                <select
                  value={loanDays}
                  onChange={(e) => setLoanDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                >
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (Standard 2 Weeks)</option>
                  <option value={21}>21 Days (3 Weeks)</option>
                  <option value={30}>30 Days (Monthly Reference)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Due Date
                </label>
                <div className="px-3 py-2 bg-white/50 border border-white/80 rounded-xl text-slate-600 font-mono text-xs">
                  {new Date(Date.now() + loanDays * 86400000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/60">
              <Link
                href="/librarian/books"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl transition-colors"
              >
                Catalogue
              </Link>
              <button
                type="submit"
                disabled={submitting || books.length === 0}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                <span>Authorize & Issue Book</span>
              </button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}

export default function LibrarianIssuePage() {
  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Circulation Desk — Issue Book"
        subtitle="Authorize physical copy checkout for verified school members"
        badge="Issue Register"
        actions={
          <Link
            href="/librarian/returns"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
          >
            <span>Process Returns</span>
          </Link>
        }
      />
      <Suspense fallback={<div className="text-xs text-slate-500">Loading issue console...</div>}>
        <IssueBookContent />
      </Suspense>
    </DashboardLayout>
  );
}

