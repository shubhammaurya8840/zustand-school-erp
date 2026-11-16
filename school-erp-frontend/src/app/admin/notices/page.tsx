'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Calendar,
  Archive,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  Layers,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { noticeService } from '@/services/notice.service';
import { masterDataService, ClassModel } from '@/services/master-data.service';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'ACADEMIC',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    targetClassId: '',
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  const loadNotices = async () => {
    try {
      setLoading(true);
      const res = await noticeService.getAll({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      setNotices(res.notices || []);
    } catch (err: any) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [selectedCategory]);

  useEffect(() => {
    masterDataService.getClasses().then(setClasses).catch(() => {});
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      await noticeService.create({
        title: form.title,
        content: form.content,
        category: form.category,
        priority: form.priority,
        targetAudience: form.targetAudience,
        targetClassId: form.targetClassId ? form.targetClassId : undefined,
        expiresAt: new Date(form.expiresAt).toISOString(),
      });
      setMessage({ type: 'success', text: 'School circular published successfully!' });
      setIsCreateOpen(false);
      setForm({
        title: '',
        content: '',
        category: 'ACADEMIC',
        priority: 'NORMAL',
        targetAudience: 'ALL',
        targetClassId: '',
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      loadNotices();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to publish notice' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await noticeService.archive(id);
      setMessage({ type: 'success', text: 'Notice archived' });
      loadNotices();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to archive notice' });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Bell className="w-7 h-7 text-navy/70" />
              Notices & School Circulars
            </h1>
            <p className="text-sm text-navy/60">
              Publish school-wide announcements, emergency advisories, and targeted circulars
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Publish Notice</span>
          </button>
        </div>

        {/* Alerts */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-800'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Filter bar */}
        <GlassCard className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-navy/50" />
            <span className="text-xs font-semibold text-navy/70">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="ALL">All Categories</option>
              <option value="ACADEMIC">Academic</option>
              <option value="EVENT">Events & Activities</option>
              <option value="EXAMINATION">Examinations</option>
              <option value="HOLIDAY">Holidays & Vacations</option>
              <option value="GENERAL">General Information</option>
              <option value="EMERGENCY">Emergency / Urgent</option>
            </select>
          </div>
        </GlassCard>

        {/* Notices Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading published circulars...</p>
          </div>
        ) : notices.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Bell className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No active circulars</p>
            <p className="text-xs text-navy/40 mt-1">Click "Publish Notice" to post an announcement</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <GlassCard key={n.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
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
                    <span className="text-[10px] font-medium text-navy/50">
                      Audience: {n.targetAudience}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy">{n.title}</h3>
                  <p className="text-xs text-navy/80 leading-relaxed whitespace-pre-wrap">{n.content}</p>

                  <div className="flex items-center gap-4 text-[11px] text-navy/50 pt-2 border-t border-white/50">
                    <span>Published: {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}</span>
                    {n.expiresAt && <span>Expires: {new Date(n.expiresAt).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 self-end sm:self-start">
                  <GlassButton
                    onClick={() => handleArchive(n.id)}
                    className="text-xs px-3 py-1.5 flex items-center gap-1.5 text-navy/60 hover:text-rose-700"
                    title="Archive Circular"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Publish Notice Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Publish School Circular</h2>
                  </div>
                  <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Circular Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual Sports Meet 2026 Schedule & Guidelines"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Category *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      >
                        <option value="ACADEMIC">Academic</option>
                        <option value="EVENT">Events & Activities</option>
                        <option value="EXAMINATION">Examinations</option>
                        <option value="HOLIDAY">Holidays & Vacations</option>
                        <option value="GENERAL">General Information</option>
                        <option value="EMERGENCY">Emergency / Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Priority Level *</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      >
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Target Audience *</label>
                      <select
                        value={form.targetAudience}
                        onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      >
                        <option value="ALL">Everyone (School-Wide)</option>
                        <option value="STUDENTS">Students Only</option>
                        <option value="PARENTS">Parents Only</option>
                        <option value="TEACHERS">Teachers Only</option>
                        <option value="CLASS_SPECIFIC">Specific Class</option>
                      </select>
                    </div>

                    {form.targetAudience === 'CLASS_SPECIFIC' ? (
                      <div>
                        <label className="block text-navy/70 font-medium mb-1">Target Class *</label>
                        <select
                          required
                          value={form.targetClassId}
                          onChange={(e) => setForm({ ...form, targetClassId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                        >
                          <option value="">-- Choose Class --</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-navy/70 font-medium mb-1">Expires On</label>
                        <input
                          type="date"
                          value={form.expiresAt}
                          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Notice Body / Content *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write the full circular announcement here..."
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Publishing...' : 'Publish Circular'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

