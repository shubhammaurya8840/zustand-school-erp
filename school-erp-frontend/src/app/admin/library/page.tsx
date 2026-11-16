'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  BookMarked,
  ArrowRight,
  Clock,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { libraryService, BookItem } from '@/services/library.service';
import { reportService } from '@/services/report.service';

export default function AdminLibraryPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [stats, setStats] = useState<any>({
    totalTitles: 0,
    totalCopies: 0,
    issuedBooks: 0,
    overdueBooks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookRes, dashData] = await Promise.all([
        libraryService.getBooks({ limit: 12 }),
        reportService.getLibraryDashboard().catch(() => null),
      ]);
      setBooks(bookRes.books || []);
      if (dashData) {
        setStats(dashData);
      } else {
        const totalCopies = (bookRes.books || []).reduce((acc: number, b: any) => acc + (b.totalCopies || 0), 0);
        const availableCopies = (bookRes.books || []).reduce((acc: number, b: any) => acc + (b.availableCopies || 0), 0);
        setStats({
          totalTitles: bookRes.total || 0,
          totalCopies: totalCopies,
          issuedBooks: Math.max(0, totalCopies - availableCopies),
          overdueBooks: 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to load library overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-navy/70" />
              Institutional Library & Circulation
            </h1>
            <p className="text-sm text-navy/60">
              Audit literary catalogue, circulation ratios, active member borrows, and shelf inventory
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/librarian/books">
              <GlassButton className="text-xs px-3 py-2 flex items-center gap-1.5 bg-navy text-white shadow-md">
                <span>Manage Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-navy/50 block">Book Titles</span>
              <span className="text-xl font-bold text-navy">{stats.totalTitles || books.length}</span>
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-navy/50 block">Total Volume Copies</span>
              <span className="text-xl font-bold text-navy">{stats.totalCopies || 0}</span>
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-navy/50 block">Currently Issued</span>
              <span className="text-xl font-bold text-amber-700">{stats.issuedBooks || 0}</span>
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-navy/50 block">Overdue Loans</span>
              <span className="text-xl font-bold text-rose-700">{stats.overdueBooks || 0}</span>
            </div>
          </GlassCard>
        </div>

        {/* Quick Operations Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/librarian/issue" className="block">
            <div className="p-3.5 rounded-2xl bg-white/50 border border-white/70 hover:bg-white/70 transition-all flex items-center justify-between text-xs font-semibold text-navy">
              <span>Issue Book</span>
              <ArrowRight className="w-4 h-4 text-navy/40" />
            </div>
          </Link>
          <Link href="/librarian/returns" className="block">
            <div className="p-3.5 rounded-2xl bg-white/50 border border-white/70 hover:bg-white/70 transition-all flex items-center justify-between text-xs font-semibold text-navy">
              <span>Process Returns</span>
              <ArrowRight className="w-4 h-4 text-navy/40" />
            </div>
          </Link>
          <Link href="/librarian/overdue" className="block">
            <div className="p-3.5 rounded-2xl bg-white/50 border border-white/70 hover:bg-white/70 transition-all flex items-center justify-between text-xs font-semibold text-navy">
              <span>Overdue Fines</span>
              <ArrowRight className="w-4 h-4 text-navy/40" />
            </div>
          </Link>
          <Link href="/librarian/inventory" className="block">
            <div className="p-3.5 rounded-2xl bg-white/50 border border-white/70 hover:bg-white/70 transition-all flex items-center justify-between text-xs font-semibold text-navy">
              <span>Shelf Audit</span>
              <ArrowRight className="w-4 h-4 text-navy/40" />
            </div>
          </Link>
        </div>

        {/* Catalogue Sample */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-sm text-navy">Catalogue Snapshot</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
              <input
                type="text"
                placeholder="Search catalogue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading library records...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="p-12 text-center text-navy/50">
              <p className="font-semibold text-navy">No books found in catalogue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">ISBN</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Rack / Shelf</th>
                    <th className="py-3 px-4 text-center">Available Copies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {filteredBooks.map((bk) => (
                    <tr key={bk.id} className="hover:bg-white/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-navy">{bk.title}</td>
                      <td className="py-3 px-4 text-navy/70">{bk.author}</td>
                      <td className="py-3 px-4 font-mono text-navy/60">{bk.isbn}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy/5 text-navy/70">
                          {bk.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-navy/60">{bk.rackLocation || bk.rackNo || '--'}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {bk.availableCopies} / {bk.totalCopies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
