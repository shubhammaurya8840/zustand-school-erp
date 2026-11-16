'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { StatCard } from '@/components/common/StatCard';
import { libraryService, BookItem } from '@/services/library.service';
import { reportService } from '@/services/report.service';
import {
  Sparkles,
  BookMarked,
  BookOpen,
  Layers,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function LibrarianInventoryPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await libraryService.getBooks({ limit: 100 });
      setBooks(res.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const totalTitles = books.length;
  const totalPhysicalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
  const totalAvailable = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
  const totalBorrowed = totalPhysicalCopies - totalAvailable;

  // Category breakdown
  const categoryMap: Record<string, { titles: number; total: number; available: number }> = {};
  for (const b of books) {
    const cat = b.category || 'General';
    if (!categoryMap[cat]) categoryMap[cat] = { titles: 0, total: 0, available: 0 };
    categoryMap[cat].titles += 1;
    categoryMap[cat].total += b.totalCopies;
    categoryMap[cat].available += b.availableCopies;
  }

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Shelf Inventory & Stock Audit"
        subtitle="Live reconciliation of physical assets, category volumes and rack allocations"
        badge="Stock Audit"
        actions={
          <button
            onClick={() => loadInventory()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Audit Refresh</span>
          </button>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Catalogued Titles"
          value={totalTitles}
          subValue="Unique book registrations"
          change="Verified"
          isPositive={true}
          iconName="BookMarked"
          iconColor="text-indigo-600"
          bgTint="bg-indigo-50"
        />
        <StatCard
          label="Total Physical Volumes"
          value={totalPhysicalCopies}
          subValue="Copies across school racks"
          change="Physical"
          isPositive={true}
          iconName="Layers"
          iconColor="text-emerald-600"
          bgTint="bg-emerald-50"
        />
        <StatCard
          label="On-Shelf Availability"
          value={totalAvailable}
          subValue="Available for immediate loan"
          change="Ready"
          isPositive={true}
          iconName="CheckCircle2"
          iconColor="text-teal-600"
          bgTint="bg-teal-50"
        />
        <StatCard
          label="Currently Borrowed"
          value={totalBorrowed}
          subValue="In hands of scholars & faculty"
          change="Circulating"
          isPositive={true}
          iconName="BookOpen"
          iconColor="text-amber-600"
          bgTint="bg-amber-50"
        />
      </div>

      {/* Category Breakdown Table */}
      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40">
          <h3 className="text-sm font-black text-slate-800">Category-wise Inventory Reconciliation</h3>
          <p className="text-[11px] text-slate-500 font-medium">Distribution of library assets by curriculum subject</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Auditing shelf records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Subject Category</th>
                  <th className="py-3 px-4 text-center">Distinct Titles</th>
                  <th className="py-3 px-4 text-center">Total Volumes</th>
                  <th className="py-3 px-4 text-center">Available on Shelf</th>
                  <th className="py-3 px-4 text-center">Checked Out</th>
                  <th className="py-3 px-4 text-right">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {Object.entries(categoryMap).map(([category, stats]) => {
                  const healthPercent = stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0;
                  return (
                    <tr key={category} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>{category}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {stats.titles}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {stats.total}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {stats.available}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                        {stats.total - stats.available}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {healthPercent}% Ready
                        </span>
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

