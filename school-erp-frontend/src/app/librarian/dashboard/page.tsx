'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { MiniCalendar } from '@/components/widgets/MiniCalendar';
import { QuickActionModals } from '@/components/modals/QuickActionModals';
import { libraryService } from '@/services/library.service';
import { reportService } from '@/services/report.service';
import { PlusCircle, RefreshCw } from 'lucide-react';

export default function LibrarianDashboardPage() {
  const [modal, setModal] = useState<'issue-book' | null>(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [circulation, setCirculation] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookRes, circRes, metricRes] = await Promise.all([
        libraryService.getBooks({ limit: 50 }).catch(() => ({ books: [], total: 0 })),
        libraryService.getCirculation('ISSUED', 20).catch(() => []),
        reportService.getLibraryDashboard().catch(() => null),
      ]);

      if (bookRes?.books) setBooks(bookRes.books);
      if (Array.isArray(circRes)) setCirculation(circRes);
      if (metricRes) setMetrics(metricRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const bookColumns: ColumnDef<any>[] = [
    {
      key: 'title',
      header: 'Book Title & Barcode',
      render: (b) => (
        <div>
          <div className="font-bold text-slate-800 text-xs">{b.title}</div>
          <div className="text-[10px] text-slate-400 font-mono">Barcode: {b.barcode} • ISBN: {b.isbn}</div>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Author & Category',
      render: (b) => (
        <div>
          <div className="font-semibold text-slate-700 text-xs">{b.author}</div>
          <div className="text-[10px] text-slate-400">{b.category}</div>
        </div>
      ),
    },
    {
      key: 'copies',
      header: 'Available Copies',
      render: (b) => (
        <span className="font-bold text-xs text-indigo-700">
          {b.availableCopies} of {b.totalCopies}
        </span>
      ),
    },
    {
      key: 'rack',
      header: 'Location',
      render: (b) => <span className="text-slate-600 text-xs">{b.rackLocation || 'General Rack'}</span>,
    },
  ];

  const circulationColumns: ColumnDef<any>[] = [
    {
      key: 'book',
      header: 'Book',
      render: (c) => <span className="font-semibold text-slate-800 text-xs">{c.book?.title || 'Book'}</span>,
    },
    {
      key: 'borrower',
      header: 'Borrower',
      render: (c) => (
        <span className="text-slate-700 text-xs">
          {c.student ? `${c.student.firstName} ${c.student.lastName} (${c.student.admissionNo})` : 'Staff'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Return Due Date',
      render: (c) => (
        <span className="text-xs text-slate-500 font-medium">
          {new Date(c.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {c.status}
        </span>
      ),
    },
  ];

  const totalTitles = books.length;
  const totalVolume = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
  const activeLoans = circulation.length;

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Knowledge Center & Library Dashboard"
        subtitle="Julian Montgomery • Central Library & Learning Commons"
        badge="Archive Inventory v2.4"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setModal('issue-book')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
              type="button"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Issue Book</span>
            </button>
          </div>
        }
      />

      {/* Librarian Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Catalogued Titles"
          value={totalTitles}
          subValue="Active registered titles"
          change="Catalog"
          isPositive={true}
          iconName="BookOpen"
          iconColor="text-indigo-600"
          bgTint="bg-indigo-50/80"
        />
        <StatCard
          label="Total Physical Volumes"
          value={totalVolume}
          subValue="Total copy inventory"
          change="Available"
          isPositive={true}
          iconName="Library"
          iconColor="text-emerald-600"
          bgTint="bg-emerald-50/80"
        />
        <StatCard
          label="Books On Loan"
          value={activeLoans}
          subValue="Active student & staff checkouts"
          change="Circulation"
          isPositive={true}
          iconName="Clock"
          iconColor="text-sky-600"
          bgTint="bg-sky-50/80"
        />
        <StatCard
          label="Library Members"
          value="1,480"
          subValue="Active students & faculty"
          change="Enrolled"
          isPositive={true}
          iconName="Users"
          iconColor="text-amber-600"
          bgTint="bg-amber-50/80"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <DataTable
            title="Library Catalogue Inventory"
            subtitle="Catalogued volumes in PostgreSQL inventory"
            columns={bookColumns}
            data={books}
            emptyMessage="No books registered in the catalogue yet."
          />

          <DataTable
            title="Active Circulation & Issues"
            subtitle="Current checkouts and return due dates"
            columns={circulationColumns}
            data={circulation}
            emptyMessage="No books currently checked out."
          />
        </div>
        <div>
          <MiniCalendar />
        </div>
      </div>

      <QuickActionModals
        activeModal={modal}
        onClose={() => setModal(null)}
        onSuccess={() => loadData()}
      />
    </DashboardLayout>
  );
}
