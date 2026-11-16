'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { feeService } from '@/services/fee.service';
import { masterDataService, ClassModel, AcademicSessionModel } from '@/services/master-data.service';

export default function AdminFeesPage() {
  const [activeTab, setActiveTab] = useState<'structures' | 'heads' | 'defaulters'>('structures');
  const [structures, setStructures] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddStructureOpen, setIsAddStructureOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter state
  const [selectedClassId, setSelectedClassId] = useState('ALL');

  // New Structure Form
  const [form, setForm] = useState({
    sessionId: '',
    classId: '',
    feeHeadId: '',
    amount: 5000,
    dueDate: new Date().toISOString().split('T')[0],
    frequency: 'MONTHLY',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [headsData, structData, defData, classData, sessData] = await Promise.all([
        feeService.getHeads(),
        feeService.getStructures(),
        feeService.getDefaulters(),
        masterDataService.getClasses(),
        masterDataService.getAcademicSessions(),
      ]);
      setFeeHeads(headsData || []);
      setStructures(structData || []);
      setDefaulters(defData || []);
      setClasses(classData || []);
      setSessions(sessData || []);
      if (sessData && sessData.length > 0) {
        const current = sessData.find((s) => s.isCurrent) || sessData[0];
        setForm((prev) => ({ ...prev, sessionId: current.id }));
      }
    } catch (err: any) {
      console.error('Failed to load fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      await feeService.createStructure({
        sessionId: form.sessionId,
        classId: form.classId,
        feeHeadId: form.feeHeadId,
        amount: Number(form.amount),
        dueDate: new Date(form.dueDate).toISOString(),
        frequency: form.frequency,
      });
      setMessage({ type: 'success', text: 'Fee structure configured successfully!' });
      setIsAddStructureOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create fee structure' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStructures =
    selectedClassId === 'ALL'
      ? structures
      : structures.filter((s) => s.classId === selectedClassId);

  const filteredDefaulters =
    selectedClassId === 'ALL'
      ? defaulters
      : defaulters.filter((d) => d.classId === selectedClassId);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-navy/70" />
              Fee Structures & Dues Management
            </h1>
            <p className="text-sm text-navy/60">
              Configure institutional fee policies, monitor collection structures, and review outstanding dues
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddStructureOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Fee Structure</span>
          </button>
        </div>

        {/* Message */}
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy/10 pb-2">
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'structures'
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white/40 text-navy/70 hover:bg-white/60'
            }`}
          >
            Fee Structures ({structures.length})
          </button>
          <button
            onClick={() => setActiveTab('heads')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'heads'
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white/40 text-navy/70 hover:bg-white/60'
            }`}
          >
            Fee Heads ({feeHeads.length})
          </button>
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'defaulters'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Pending Dues / Defaulters ({defaulters.length})
          </button>
        </div>

        {/* Filter Toolbar */}
        <GlassCard className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-navy/40" />
            <span className="text-xs font-semibold text-navy/70">Filter by Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        {/* Tab 1: Fee Structures */}
        {activeTab === 'structures' && (
          <div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
                <p className="text-sm">Loading fee structures...</p>
              </div>
            ) : filteredStructures.length === 0 ? (
              <GlassCard className="p-12 text-center text-navy/50">
                <CreditCard className="w-12 h-12 mx-auto text-navy/20 mb-3" />
                <p className="text-base font-semibold text-navy">No fee structures defined</p>
                <p className="text-xs text-navy/40 mt-1">Configure class fee structures for the academic session</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStructures.map((st) => (
                  <GlassCard key={st.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-navy/40">
                            {st.feeHead?.name || 'Fee Head'}
                          </span>
                          <h3 className="font-bold text-navy text-base">{st.class?.name || 'Class'}</h3>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                          ₹{Number(st.amount).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/50 space-y-1.5 text-xs text-navy/70">
                        <div className="flex items-center justify-between">
                          <span className="text-navy/40">Frequency:</span>
                          <span className="font-semibold">{st.frequency}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-navy/40">Due Date:</span>
                          <span className="font-medium">{new Date(st.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-navy/40">Session:</span>
                          <span className="font-medium">{st.session?.name || 'Current'}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Fee Heads */}
        {activeTab === 'heads' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {feeHeads.map((head) => (
              <GlassCard key={head.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-navy text-base">{head.name}</h3>
                    <p className="text-xs font-mono text-navy/50">Code: {head.code}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-800 border border-blue-500/20">
                    {head.isRefundable ? 'Refundable' : 'Non-Refundable'}
                  </span>
                </div>
                <p className="text-xs text-navy/60 mt-3 pt-3 border-t border-white/50">
                  {head.description || 'Standard institutional revenue head'}
                </p>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Tab 3: Defaulters */}
        {activeTab === 'defaulters' && (
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm">Students with Outstanding Institutional Balances</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {filteredDefaulters.length} Record{filteredDefaulters.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredDefaulters.length === 0 ? (
              <div className="p-12 text-center text-navy/50">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-navy">No Outstanding Fee Defaulters</p>
                <p className="text-xs text-navy/40 mt-1">All accounts are settled or within grace period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Admission No</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Parent Contact</th>
                      <th className="py-3 px-4 text-right">Pending Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {filteredDefaulters.map((def: any) => (
                      <tr key={def.id} className="hover:bg-white/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-navy">
                          {def.firstName} {def.lastName}
                        </td>
                        <td className="py-3 px-4 font-mono text-navy/60">{def.admissionNo}</td>
                        <td className="py-3 px-4">{def.class?.name || 'Class'}</td>
                        <td className="py-3 px-4 text-navy/60">{def.parent?.primaryPhone || 'N/A'}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          ₹{Number(def.balance || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        )}

        {/* Add Structure Modal */}
        <AnimatePresence>
          {isAddStructureOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Configure Fee Structure</h2>
                  </div>
                  <button onClick={() => setIsAddStructureOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Academic Session *</label>
                    <select
                      required
                      value={form.sessionId}
                      onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Target Class *</label>
                    <select
                      required
                      value={form.classId}
                      onChange={(e) => setForm({ ...form, classId: e.target.value })}
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

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Fee Head *</label>
                    <select
                      required
                      value={form.feeHeadId}
                      onChange={(e) => setForm({ ...form, feeHeadId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      <option value="">-- Choose Fee Head --</option>
                      {feeHeads.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="50"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Frequency *</label>
                      <select
                        value={form.frequency}
                        onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="HALF_YEARLY">Half Yearly</option>
                        <option value="ANNUALLY">Annually</option>
                        <option value="ONE_TIME">One Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Due Date *</label>
                      <input
                        type="date"
                        required
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAddStructureOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Saving...' : 'Save Structure'}
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

