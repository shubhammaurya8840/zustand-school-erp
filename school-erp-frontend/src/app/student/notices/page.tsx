'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { noticeService } from '@/services/notice.service';

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    noticeService
      .getAll({ category: selectedCategory !== 'ALL' ? selectedCategory : undefined })
      .then((res) => setNotices(res.notices || []))
      .catch((err) => console.error('Failed to load notices:', err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Bell className="w-7 h-7 text-navy/70" />
              School Notices & Circulars
            </h1>
            <p className="text-sm text-navy/60">
              Official school announcements, student council advisories, and event schedules
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <GlassCard className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-navy/50" />
            <span className="text-xs font-semibold text-navy/70">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="ALL">All Circulars</option>
              <option value="ACADEMIC">Academic</option>
              <option value="EVENT">Events & Sports</option>
              <option value="EXAMINATION">Examinations</option>
              <option value="HOLIDAY">Holidays & Vacations</option>
              <option value="GENERAL">General Notice</option>
            </select>
          </div>
        </GlassCard>

        {/* Notices Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading circulars...</p>
          </div>
        ) : notices.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Bell className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No active notices found</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <GlassCard key={n.id} className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      n.priority === 'HIGH' || n.priority === 'URGENT'
                        ? 'bg-rose-500/10 text-rose-800 border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-800 border-blue-500/20'
                    }`}
                  >
                    {n.priority}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy/5 text-navy/70 border border-navy/10">
                    {n.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-navy">{n.title}</h3>
                <p className="text-xs text-navy/80 leading-relaxed whitespace-pre-wrap">{n.content}</p>

                <div className="flex items-center gap-4 text-[11px] text-navy/50 pt-2 border-t border-white/50">
                  <span>Published: {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}</span>
                  {n.expiresAt && <span>Valid Until: {new Date(n.expiresAt).toLocaleDateString()}</span>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

