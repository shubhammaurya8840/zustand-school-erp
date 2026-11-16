'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  BookOpen,
  Users,
  Search,
  X,
  Loader2,
  CheckCircle2,
  ChevronRight,
  School,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { masterDataService, ClassModel } from '@/services/master-data.service';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Class form
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    numericOrder: 1,
    stream: '',
    initialSection: '',
    initialCapacity: 40,
  });
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  // Section form
  const [sectionForm, setSectionForm] = useState({
    name: 'A',
    capacity: 40,
  });

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await masterDataService.getClasses();
      setClasses(data);
    } catch (err: any) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      await masterDataService.createClass({
        name: classForm.name.trim(),
        code: classForm.code.toUpperCase().trim(),
        numericOrder: Number(classForm.numericOrder),
        stream: classForm.stream.trim() ? classForm.stream.trim() : undefined,
        initialSection: classForm.initialSection.trim() ? classForm.initialSection.trim().toUpperCase() : undefined,
        initialCapacity: classForm.initialCapacity ? Number(classForm.initialCapacity) : 40,
      });
      setMessage({ type: 'success', text: `Class ${classForm.name} created successfully!` });
      setIsAddClassModalOpen(false);
      setClassForm({ name: '', code: '', numericOrder: 1, stream: '', initialSection: '', initialCapacity: 40 });
      loadClasses();
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to create class';
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate') || errMsg.toLowerCase().includes('identical')) {
        setDuplicateAlert(errMsg);
      } else {
        setMessage({ type: 'error', text: errMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    try {
      setSubmitting(true);
      setMessage(null);
      await masterDataService.createSection(selectedClassId, {
        name: sectionForm.name.toUpperCase().trim(),
        capacity: Number(sectionForm.capacity),
      });
      setMessage({ type: 'success', text: `Section ${sectionForm.name} added successfully!` });
      setIsAddSectionModalOpen(false);
      setSectionForm({ name: 'B', capacity: 40 });
      loadClasses();
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to add section';
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate')) {
        setDuplicateAlert(errMsg);
      } else {
        setMessage({ type: 'error', text: errMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (classId: string, sectionId: string, sectionName: string) => {
    if (!window.confirm(`Are you sure you want to delete Section "${sectionName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const res = await masterDataService.deleteSection(sectionId);
      setMessage({ type: 'success', text: res.message || `Section ${sectionName} deleted successfully!` });
      loadClasses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete section' });
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <School className="w-7 h-7 text-navy/70" />
              Classes & Grades Management
            </h1>
            <p className="text-sm text-navy/60">
              Configure standard academic levels, numeric progression, and class sections
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddClassModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Class</span>
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

        {/* Search */}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Filter classes by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white/60 border border-white/60 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
        </GlassCard>

        {/* Class Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading school classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <School className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No classes found</p>
            <p className="text-xs text-navy/40 mt-1">Add a new class to initialize the academic hierarchy</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClasses.map((cls) => (
              <GlassCard key={cls.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center font-bold text-navy text-sm border border-white/60">
                        {cls.numericOrder}
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy text-base">{cls.name}</h3>
                        <p className="text-xs font-mono text-navy/50">Code: {cls.code}</p>
                      </div>
                    </div>
                    {cls.stream && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-800 border border-indigo-500/20">
                        {cls.stream}
                      </span>
                    )}
                  </div>

                  {/* Sections list */}
                  <div className="mt-4 pt-3 border-t border-white/50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-navy/60">
                      <span>Active Sections</span>
                      <span>Capacity</span>
                    </div>
                    <div className="space-y-1.5">
                      {cls.sections && cls.sections.length > 0 ? (
                        cls.sections.map((sec) => (
                          <div
                            key={sec.id}
                            className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/40 border border-white/60 text-xs group"
                          >
                            <span className="font-semibold text-navy">Section {sec.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-navy/60">{sec.capacity} students</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(cls.id, sec.id, sec.name)}
                                title={`Delete Section ${sec.name}`}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-navy/40 italic py-1">No sections created yet</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/50 flex items-center justify-between">
                  <span className="text-xs text-navy/50">
                    {cls.sections?.length || 0} Section{(cls.sections?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <GlassButton
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setIsAddSectionModalOpen(true);
                    }}
                    className="text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Add Class Modal */}
        <AnimatePresence>
          {isAddClassModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <School className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Add New Class</h2>
                  </div>
                  <button onClick={() => setIsAddClassModalOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Class Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Class 11 - Science"
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Class Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CL-11-SCI"
                      value={classForm.code}
                      onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Numeric Order (for sorting) *</label>
                    <input
                      type="number"
                      required
                      min="-2"
                      max="20"
                      value={classForm.numericOrder}
                      onChange={(e) => setClassForm({ ...classForm, numericOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Stream (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Science / Commerce / Arts"
                      value={classForm.stream}
                      onChange={(e) => setClassForm({ ...classForm, stream: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-navy/10">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">
                        Initial Section <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. A (or leave blank)"
                        value={classForm.initialSection}
                        onChange={(e) => setClassForm({ ...classForm, initialSection: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy font-bold uppercase focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">
                        Capacity <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Default 40"
                        value={classForm.initialCapacity}
                        onChange={(e) => setClassForm({ ...classForm, initialCapacity: parseInt(e.target.value) || 40 })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAddClassModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Saving...' : 'Create Class'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Section Modal */}
        <AnimatePresence>
          {isAddSectionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Add Section</h2>
                  </div>
                  <button onClick={() => setIsAddSectionModalOpen(false)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSection} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Section Identifier *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A, B, C, Rose, Lotus"
                      value={sectionForm.name}
                      onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Student Capacity *</label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="100"
                      value={sectionForm.capacity}
                      onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) || 40 })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAddSectionModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Saving...' : 'Add Section'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Duplicate Record Alert Popup */}
        <AnimatePresence>
          {duplicateAlert && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Already Exists in Database</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{duplicateAlert}</p>
                <button
                  onClick={() => setDuplicateAlert(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Understood, I will change the details
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

